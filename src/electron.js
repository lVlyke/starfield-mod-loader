// @ts-check

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const url = require("url");
const path = require("path");
const fs = require("fs");
const os = require('os');
const _ = require("lodash");
const Seven = require("node-7z");
const sevenBin = require("7zip-bin"); //  TODO - License?

class ElectronLoader {
    
    /** @type BrowserWindow */ mainWindow;
    /** @type Record<string, any> */ monitoredPaths = {};
    /** @type Record<string, boolean> */ ignorePathChanges = {};

    constructor() {
        Menu.setApplicationMenu(this.createMenu());

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(() => {
            this.initWindow();

            // TODO - Only enable in debug mode
            // this.mainWindow.webContents.once("dom-ready", async () => {
            //     await installExtension([REDUX_DEVTOOLS])
            //         .then((name) => log.debug(`Added Extension:  ${name}`))
            //         .catch((err) => log.debug("An error occurred: ", err));
            // });

            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.initWindow();
                }
            });
        });

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        ipcMain.handle("app:reload", () => this.loadApp());

        ipcMain.handle("app:loadSettings", async (_event, _data) => {
            try {
                return this.loadSettings();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:saveSettings", async (_event, data) => {
           this.saveSettings(data.settings);
        });

        ipcMain.handle("app:loadProfile", async (_event, data) => {
            return this.loadProfile(data.name);
        });

        ipcMain.handle("app:saveProfile", async (_event, data) => {
            this.saveProfile(data.profile.name, data.profile);
        });

        ipcMain.handle("app:verifyProfile", async (_event, data) => {
            const modVerifyResult = this.verifyProfileModsExist(data.profile);
            const modDirVerifyResult = this.verifyProfileModDirExists(data.profile);
            const gameDirVerifyResult = this.verifyProfileGameDirExists(data.profile);

            return {
                mods: modVerifyResult,
                modBaseDir: modDirVerifyResult,
                gameBaseDir: gameDirVerifyResult
            };
        });

        ipcMain.handle("profile:addMod", async (_event, data) => {
            const pickedFile = (await dialog.showOpenDialog({
                filters: [
                    { 
                        name: "Mod", extensions: [
                            "zip",
                            "rar",
                            "7z",
                            "7zip",
                        ]
                    }
                ]
            }));
            
            const filePath = pickedFile.filePaths[0];
            const fileType = path.extname(filePath);
            const modName = path.basename(filePath, fileType);
            const modDirPath = path.join("profiles", data.profile.name, "mods", modName);

            if (!!filePath) {
                /** @type Promise */ let decompressOperation;

                switch (fileType.toLowerCase()) {
                    case ".7z":
                    case ".7zip":
                    case ".zip":
                    case ".rar": {
                        decompressOperation = new Promise((resolve, _reject) => {
                            const decompressStream = Seven.extractFull(filePath, modDirPath, {
                                $bin: sevenBin.path7za
                            });

                            decompressStream.on("end", () => resolve(true));
                            decompressStream.on("error", (e) => {
                                log.error(e);
                                resolve(false);
                            });
                        });
                    } break;
                    default: {
                        log.error("Unrecognized mod format", fileType);
                        decompressOperation = Promise.resolve(false);
                    } break;
                }

                if (await decompressOperation) {
                    return {
                        name: modName,
                        modRef: {
                            path: modName,
                            enabled: true
                        }
                    };
                }
            }

            return null;
        });
    }

    initWindow() {
        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            width: 1920,
            height: 1080,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
    
        this.loadApp();
    }

    loadApp() {
        // and load the index.html of the app.
        this.mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, `index.html`),
                protocol: "file:",
                slashes: true
            })
        );
    }

    /** @requires Menu */
    createMenu() {
        return Menu.buildFromTemplate([
            {
                label: 'File',
                submenu: [
                    {
                        role: 'quit'
                    }
                ]
            },

            {
                label: 'Profile',
                submenu: [
                    {
                        label: "Change Profile...",
                        click: () => this.mainWindow.webContents.send("app:changeProfile")
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: "Add Mod...",
                        click: () => this.mainWindow.webContents.send("profile:addMod")
                    },
                    {
                        label: "Settings",
                        click: () => this.mainWindow.webContents.send("profile:settings")
                    },
                ]
            },

            {
                label: 'View',
                submenu: [
                    {
                        role: 'toggleDevTools'
                    }
                ]
            },
        ]);
    }

    loadSettings() {
        const settingsSrc = fs.readFileSync("settings.json"); // TODO

        return JSON.parse(settingsSrc.toString("utf8"));
    }

    saveSettings(settings) {
        return fs.writeFileSync(
            path.join("settings.json"),
            JSON.stringify(settings)
        );
    }

    loadProfile(/** @type string */ name) {
        const profileDir = path.join("profiles", name);
        const profileSettingsName = "profile.json";
        const profileSettingsPath = path.join(profileDir, profileSettingsName);

        if (!fs.existsSync(profileSettingsPath)) {
            return null;
        }

        const profileSrc = fs.readFileSync(profileSettingsPath);

        return { name, ...JSON.parse(profileSrc.toString("utf8")) };
    }

    saveProfile(/** @type string */ name, profile, options) {
        const profileDir = path.join("profiles", name);
        const profileSettingsName = "profile.json";

        fs.mkdirSync(profileDir, { recursive: true });

        return fs.writeFileSync(
            path.join(profileDir, profileSettingsName),
            JSON.stringify(_.omit(profile, ["name"])),
            options
        );
    }

    verifyProfileModsExist(profile) {
        const profileDir = path.join("profiles", profile.name);

        return _.reduce(profile.mods, (result, mod, modName) => {
            const modExists = fs.existsSync(path.join(profileDir, mod.path));

            result = Object.assign(result, {
                [modName]: {
                    error: !modExists,
                    found: modExists
                }
            });

            return result;
        }, {});
    }

    verifyProfileModDirExists(profile) {
        const modDirExists = fs.existsSync(profile.modBaseDir);
        return {
            error: !modDirExists,
            found: modDirExists
        };
    }

    verifyProfileGameDirExists(profile) {
        const gameDirExists = fs.existsSync(profile.gameBaseDir);
        return {
            error: !gameDirExists,
            found: gameDirExists
        };
    }
}

// Load the app
const loader = new ElectronLoader();