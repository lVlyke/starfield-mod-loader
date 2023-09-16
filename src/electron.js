// @ts-check

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const log = require("electron-log");
const url = require("url");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs-extra");
const _ = require("lodash");
const Seven = require("node-7z");
const sevenBin = require("7zip-bin");

const DEBUG_MODE = !app.isPackaged;

class ElectronLoader {

    static /** @type string */ APP_SETTINGS_FILE = "settings.json";
    static /** @type string */ APP_PROFILES_DIR = "profiles";
    static /** @type string */ PROFILE_SETTINGS_FILE = "profile.json";
    static /** @type string */ PROFILE_METADATA_FILE = ".sml.json";
    static /** @type string */ PROFILE_MODS_DIR = "mods";
    static /** @type string */ PROFILE_MODS_STAGING_DIR = "_tmp";
    
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

        ipcMain.handle("app:chooseDirectory", async (_event, { baseDir }) => {
            const result = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: baseDir
            });
            
            return result?.filePaths?.[0];
        });

        ipcMain.handle("app:chooseFilePath", async (_event, { baseDir, fileTypes }) => {
            const result = await dialog.showOpenDialog({
                filters: fileTypes ? [
                    {
                        name: "Files",
                        extensions: fileTypes
                    }
                ] : [],
                defaultPath: baseDir
            });
            
            return result?.filePaths?.[0];
        });

        ipcMain.handle("app:loadSettings", async (_event, _data) => {
            try {
                return this.loadSettings();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:saveSettings", async (_event, { settings }) => {
           return this.saveSettings(settings);
        });

        ipcMain.handle("app:loadProfile", async (_event, { name }) => {
            return this.loadProfile(name);
        });

        ipcMain.handle("app:saveProfile", async (_event, { profile }) => {
            return this.saveProfile(profile);
        });

        ipcMain.handle("app:verifyProfile", async (_event, { profile }) => {
            const modVerifyResult = this.verifyProfileModsExist(profile);
            const modDirVerifyResult = this.verifyProfileModDirExists(profile);
            const gameDirVerifyResult = this.verifyProfileGameDirExists(profile);

            return {
                mods: modVerifyResult,
                modBaseDir: modDirVerifyResult,
                gameBaseDir: gameDirVerifyResult
            };
        });

        ipcMain.handle("profile:findManualMods", async (_event, { profile }) => {
            return this.findManualMods(profile);
        });

        ipcMain.handle("profile:addMod", async (_event, { profile }) => {
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
            
            const filePath = pickedFile?.filePaths[0];
            if (!!filePath) {
                const fileType = path.extname(filePath);
                const modName = path.basename(filePath, fileType);
                const modDirPath = this.getProfileModDir(profile.name, modName);
                const modDirStagingPath = path.join(this.getProfileDir(profile.name), ElectronLoader.PROFILE_MODS_STAGING_DIR, modName);
                /** @type Promise */ let decompressOperation;

                switch (fileType.toLowerCase()) {
                    case ".7z":
                    case ".7zip":
                    case ".zip":
                    case ".rar": {
                        decompressOperation = new Promise((resolve, _reject) => {
                            // Look for 7-Zip installed on system
                            const _7zBinaryLocations = [
                                "7z",
                                "7z.exe",
                                "C:\\Program Files\\7-Zip\\7z.exe",
                                "C:\\Program Files (x86)\\7-Zip\\7z.exe"
                            ];
                            const decompressStream = Seven.extractFull(filePath, modDirStagingPath, {
                                // Fall back to bundled 7-Zip binary if not found on system
                                // TODO - Warn user about opening RARs if 7-Zip not installed on machine
                                $bin: _7zBinaryLocations.find(_7zPath => fs.existsSync(_7zPath)) ?? sevenBin.path7za
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
                    const modStagingDirDataDirs = [
                        path.join(modDirStagingPath, "Data"),
                        path.join(modDirStagingPath, "data"),
                    ];

                    let modDataDir = modStagingDirDataDirs.find(dataDir => fs.existsSync(dataDir));
                    if (!modDataDir) {
                        modDataDir = modDirStagingPath;
                    }

                    // TODO - Notify user of Data dir change if modDataDir exists

                    // Copy the data dir to the mod directory
                    await fs.copy(modDataDir, modDirPath, { overwrite: true });

                    // Erase the staging data
                    await fs.remove(modDirStagingPath);

                    return {
                        name: modName,
                        modRef: {
                            enabled: true
                        }
                    };
                }
            }

            return null;
        });

        ipcMain.handle("profile:importMod", async (_event, { profile }) => {
            const pickedModFolder = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            
            const folderPath = pickedModFolder?.filePaths[0];
            if (!!folderPath) {
                const modName = path.basename(folderPath);
                const modDirPath = this.getProfileModDir(profile.name, modName);
                const modDataDirs = [
                    path.join(folderPath, "Data"),
                    path.join(folderPath, "data"),
                ];

                let modDataDir = modDataDirs.find(dataDir => fs.existsSync(dataDir));
                if (!modDataDir) {
                    modDataDir = folderPath;
                }

                // TODO - Notify user of Data dir change if modDataDir exists

                // Copy the data dir to the mod directory
                await fs.copy(modDataDir, modDirPath, { overwrite: true });

                return {
                    name: modName,
                    modRef: {
                        enabled: true
                    }
                };
            }
        });

        ipcMain.handle("profile:deleteMod", async (_event, { profile, modName }) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);

            await fs.remove(modDirPath);
        });

        ipcMain.handle("profile:renameMod", async (_event, { profile, modCurName, modNewName }) => {
            const modCurDir = this.getProfileModDir(profile.name, modCurName);
            const modNewDir = this.getProfileModDir(profile.name, modNewName);

            await fs.move(modCurDir, modNewDir);
        });

        ipcMain.handle("profile:deploy", async (_event, { profile }) => {
            return this.deployProfile(profile);
        });

        ipcMain.handle("profile:undeploy", async (_event, { profile }) => {
            return this.undeployProfile(profile);
        });

        ipcMain.handle("profile:showModInFileExplorer", async (_event, { profile, modName }) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);

            shell.openPath(path.resolve(modDirPath));
        });

        ipcMain.handle("profile:showModBaseDirInFileExplorer", async (_event, { profile }) => {
            shell.openPath(path.resolve(profile.modBaseDir));
        });

        ipcMain.handle("profile:showGameBaseDirInFileExplorer", async (_event, { profile }) => {
            shell.openPath(path.resolve(profile.gameBaseDir));
        });

        ipcMain.handle("profile:showProfileBaseDirInFileExplorer", async (_event, { profile }) => {
            const profileDir = this.getProfileDir(profile.name);

            shell.openPath(path.resolve(profileDir));
        });

        ipcMain.handle("profile:showProfileModsDirInFileExplorer", async (_event, { profile }) => {
            const profileModsDir = this.getProfileModsDir(profile.name);

            shell.openPath(path.resolve(profileModsDir));
        });

        ipcMain.handle("profile:launchGame", async (_event, { profile }) => {
            exec(path.resolve(profile.gameBinaryPath));
        });
    }

    initWindow() {
        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
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
                        label: "Preferences",
                        click: () => this.mainWindow.webContents.send("app:showPreferences")
                    },
                    {
                        type: 'separator'
                    },
                    {
                        role: 'quit'
                    }
                ]
            },

            {
                label: 'Profile',
                submenu: [
                    {
                        label: "Add New Profile",
                        click: () => this.mainWindow.webContents.send("app:newProfile")
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: "Mods",
                        submenu: [
                            {
                                label: "Add Mod",
                                click: () => this.mainWindow.webContents.send("profile:addMod")
                            },
                            {
                                label: "Import Mod",
                                click: () => this.mainWindow.webContents.send("profile:importMod")
                            }
                        ]
                    },
                    {
                        label: "Profile Settings",
                        click: () => this.mainWindow.webContents.send("profile:settings")
                    },
                ]
            },

            {
                label: 'View',
                submenu: [
                    ...this.createDebugMenuOption({
                       role: "toggleDevTools"
                    })
                ]
            }
        ]);
    }

    createDebugMenuOption(menuOption) {
        return DEBUG_MODE ? [menuOption] : [];
    }

    loadSettings() {
        const settingsSrc = fs.readFileSync(ElectronLoader.APP_SETTINGS_FILE);

        return JSON.parse(settingsSrc.toString("utf8"));
    }

    saveSettings(settings) {
        return fs.writeFileSync(
            path.join(ElectronLoader.APP_SETTINGS_FILE),
            JSON.stringify(settings)
        );
    }

    getProfileDir(profileName) {
        return path.join(ElectronLoader.APP_PROFILES_DIR, profileName);
    }

    getProfileModsDir(profileName) {
        return path.join(this.getProfileDir(profileName), ElectronLoader.PROFILE_MODS_DIR);
    }

    getProfileModDir(profileName, modName) {
        return path.join(this.getProfileModsDir(profileName), modName);
    }

    loadProfile(/** @type string */ name) {
        const profileDir = this.getProfileDir(name);
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;
        const profileSettingsPath = path.join(profileDir, profileSettingsName);

        if (!fs.existsSync(profileSettingsPath)) {
            return null;
        }

        const profileSrc = fs.readFileSync(profileSettingsPath);
        const profile = JSON.parse(profileSrc.toString("utf8"));

        // Deserialize mods entries to Map
        profile.mods = new Map(profile.mods);

        return { name, ...profile };
    }

    saveProfile(profile, options) {
        const profileDir = this.getProfileDir(profile.name);
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;

        // Serialize mods Map as entries
        profile.mods = Array.from(profile.mods.entries());

        fs.mkdirSync(profileDir, { recursive: true });

        return fs.writeFileSync(
            path.join(profileDir, profileSettingsName),
            JSON.stringify(_.omit(profile, ["name"])),
            options
        );
    }

    verifyProfileModsExist(profile) {
        const modsDir = this.getProfileModsDir(profile.name);

        return Array.from(profile.mods.entries()).reduce((result, [modName, _mod]) => {
            const modExists = fs.existsSync(path.join(modsDir, modName));

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

    isProfileDeployed(profile) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);
        return fs.existsSync(metaFilePath);
    }

    readProfileDeploymentMetadata(profile) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);
        const metaFileExists = fs.existsSync(metaFilePath);

        if (!metaFileExists) {
            return undefined;
        }

        return JSON.parse(fs.readFileSync(metaFilePath).toString("utf-8"));
    }

    writeProfileDeploymentMetadata(profile, deploymentMetadata) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);

        return fs.writeFileSync(metaFilePath, JSON.stringify(deploymentMetadata));
    }

    findManualMods(profile) {
        let modDirFiles = fs.readdirSync(profile.modBaseDir, { recursive: true });

        if (this.isProfileDeployed(profile)) {
            const profileModFiles = this.readProfileDeploymentMetadata(profile).profileModFiles;
            
            // @ts-ignore
            modDirFiles = modDirFiles.filter(file => !profileModFiles.includes(file));
        }

        // Filter out directories
        return modDirFiles.filter((file) => !fs.lstatSync(path.join(profile.modBaseDir, file.toString())).isDirectory());
    }

    async deployProfile(profile) {
        const profileModFiles = [];

        if (this.isProfileDeployed(profile)) {
            await this.undeployProfile(profile);
        }

        // Copy all mods to the modBaseDir for this profile
        // (Copy mods in reverse with `overwrite: false` to allow existing manual mods in the folder to be preserved)
        const deployableModFiles = Array.from(profile.mods.entries()).reverse();
        for (const [modName, mod] of deployableModFiles) {
            if (mod.enabled) {
                const modDirPath = this.getProfileModDir(profile.name, modName);

                await fs.copy(modDirPath, profile.modBaseDir, {
                    overwrite: false,
                    filter: (src, dest) => {
                        const modRelPath = dest.replace(`${profile.modBaseDir}\\`, "");
                        const isModSubDir = fs.lstatSync(src).isDirectory();
                        // Don't copy empty directories
                        const shouldCopy = isModSubDir ? fs.readdirSync(src).length > 0 : true;

                        // Record mod files written from profile
                        if (shouldCopy && !isModSubDir && modRelPath.length > 0) {
                            profileModFiles.push(modRelPath);
                        }

                        return shouldCopy;
                    }
                });
            }
        }

        profileModFiles.push(ElectronLoader.PROFILE_METADATA_FILE);

        this.writeProfileDeploymentMetadata(profile, {
            profile: profile.name,
            profileModFiles
        });
    }

    async undeployProfile(profile) {
        if (!this.isProfileDeployed(profile)) {
            return;
        }

        const { profileModFiles } = this.readProfileDeploymentMetadata(profile);

        // Only remove files managed by this profile
        const undeployJobs = profileModFiles.map(async (existingFile) => {
            const fullExistingPath = path.join(profile.modBaseDir, existingFile);
            await fs.remove(fullExistingPath);

            // Recursively remove empty parent directories
            let existingDir = path.dirname(fullExistingPath);
            while (existingDir !== profile.modBaseDir && fs.existsSync(existingDir) && fs.readdirSync(existingDir).length === 0) {
                fs.rmdirSync(existingDir);
                existingDir = path.dirname(existingDir);
            }
        });

        // Wait for all files to be removed
        await Promise.all(undeployJobs);
    }
}

// Load the app
const loader = new ElectronLoader();