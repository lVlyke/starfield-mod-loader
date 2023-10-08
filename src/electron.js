// @ts-check
/// <reference path="./app-types.d.ts" />

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const log = require("electron-log");
const url = require("url");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs-extra");
const fsPromises = require("fs").promises;
const _ = require("lodash");
const Seven = require("node-7z");
const sevenBin = require("7zip-bin");
const which = require("which");

// TODO - Replace this with fs.readdir(..., { recursive: true }) when electron uses Node v18.17.0+
const recursiveReaddir = require("recursive-readdir");

const DEBUG_MODE = !app.isPackaged;

class ElectronLoader {

    static /** @type {string} */ APP_SETTINGS_FILE = "settings.json";
    static /** @type {string} */ APP_PROFILES_DIR = "profiles";
    static /** @type {string} */ APP_DEPS_LICENSES_FILE = path.join(__dirname, "3rdpartylicenses.txt");
    static /** @type {string} */ APP_DEPS_INFO_FILE = path.join(__dirname, "3rdpartylicenses.json");
    static /** @type {string} */ GAME_DB_FILE = path.join(__dirname, "game-db.json");
    static /** @type {string} */ PROFILE_SETTINGS_FILE = "profile.json";
    static /** @type {string} */ PROFILE_METADATA_FILE = ".sml.json";
    static /** @type {string} */ PROFILE_MODS_DIR = "mods";
    static /** @type {string} */ PROFILE_MODS_STAGING_DIR = "_tmp";
    
    /** @type {BrowserWindow} */ mainWindow;
    /** @type {Record<string, any>} */ monitoredPaths = {};
    /** @type {Record<string, boolean>} */ ignorePathChanges = {};

    constructor() {
        if (DEBUG_MODE) {
            log.transports.console.level = "debug";
        }

        log.transports.file.level = DEBUG_MODE ? "info" : "debug";
        log.transports.file.resolvePath = () => "app.log";

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

        ipcMain.handle("app:chooseDirectory", async (
            _event,
            /** @type {AppMessageData<"app:chooseDirectory">} */ { baseDir }
        ) => {
            const result = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: baseDir
            });
            
            return result?.filePaths?.[0];
        });

        ipcMain.handle("app:chooseFilePath", async (
            _event,
            /** @type {AppMessageData<"app:chooseFilePath">} */ { baseDir, fileTypes }
        ) => {
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

        ipcMain.handle("app:loadSettings", async (_event, /** @type {AppMessageData<"app:loadSettings">} */ _data) => {
            try {
                return this.loadSettings();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:saveSettings", async (_event, /** @type {AppMessageData<"app:saveSettings">} */ { settings }) => {
           return this.saveSettings(settings);
        });

        ipcMain.handle("app:loadGameDatabase", async (_event, /** @type {AppMessageData<"app:loadGameDatabase">} */ _data) => {
            try {
                return this.loadGameDatabase();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:loadProfile", async (_event, /** @type {AppMessageData<"app:loadProfile">} */ { name }) => {
            return this.loadProfile(name);
        });

        ipcMain.handle("app:saveProfile", async (_event, /** @type {AppMessageData<"app:saveProfile">} */ { profile }) => {
            return this.saveProfile(profile);
        });

        ipcMain.handle("app:deleteProfile", async (_event, /** @type {AppMessageData<"app:deleteProfile">} */ { profile }) => {
            return this.deleteProfile(profile);
        });

        ipcMain.handle("app:copyProfileMods", async (
            _event,
            /** @type {AppMessageData<"app:copyProfileMods">} */ { srcProfile, destProfile }
        ) => {
            const srcModsDir = this.getProfileModsDir(srcProfile.name);
            const destModsDir = this.getProfileModsDir(destProfile.name);

            return fs.copySync(srcModsDir, destModsDir);
        });

        ipcMain.handle("app:verifyProfile", /** @returns {Promise<AppProfileVerificationResults>} */ async (
            _event,
            /** @type {AppMessageData<"app:verifyProfile">} */ { profile }
        ) => {
            const modVerifyResult = this.verifyProfileModsExist(profile);
            const modDirVerifyResult = this.verifyProfileModDirExists(profile);
            const gameDirVerifyResult = this.verifyProfileGameDirExists(profile);

            return {
                mods: modVerifyResult,
                modBaseDir: modDirVerifyResult,
                gameBaseDir: gameDirVerifyResult
            };
        });

        ipcMain.handle("app:findBestProfileDefaults", async (
            _event,
            /** @type {AppMessageData<"app:findBestProfileDefaults">} */ { gameDetails }
        ) => {
            const result = {};

            if (gameDetails.modBaseDirs) {
                result.modBaseDir = this.#resolveWindowsEnvironmentVariables(gameDetails.modBaseDirs.find((modBaseDir) => {
                    return fs.existsSync(modBaseDir) || fs.existsSync(path.dirname(modBaseDir));
                }) ?? "");
            }

            if (gameDetails.gameBaseDirs) {
                result.gameBaseDir = this.#resolveWindowsEnvironmentVariables(gameDetails.gameBaseDirs.find((gameBaseDir) => {
                    return fs.existsSync(gameBaseDir);
                }) ?? "");
            }

            if (gameDetails.gameBinaryPaths) {
                result.gameBinaryPath = this.#resolveWindowsEnvironmentVariables(gameDetails.gameBinaryPaths.find((gameBinaryPath) => {
                    return fs.existsSync(gameBinaryPath);
                }) ?? "");
            }

            return result;
        });

        ipcMain.handle("profile:findManualMods", async (_event, /** @type {AppMessageData<"profile:findManualMods">} */ { profile }) => {
            return this.findManualMods(profile);
        });

        ipcMain.handle("profile:beginModAdd", async (
            _event,
            /** @type {AppMessageData<"profile:beginModAdd">} */ { profile, modPath }
        ) => {
            if (!modPath) {
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
                
                modPath = pickedFile?.filePaths[0];
            }
            
            const filePath = modPath ?? "";
            if (!!filePath) {
                const fileType = path.extname(filePath);
                const modName = path.basename(filePath, fileType);
                const modDirStagingPath = path.join(this.getProfileDir(profile.name), ElectronLoader.PROFILE_MODS_STAGING_DIR, modName);
                const modFilePaths = [];
                /** @type Promise */ let decompressOperation;

                switch (fileType.toLowerCase()) {
                    case ".7z":
                    case ".7zip":
                    case ".zip":
                    case ".rar": {
                        decompressOperation = new Promise((resolve, _reject) => {
                            // Look for 7-Zip installed on system
                            const _7zBinaries = [
                                "7zzs",
                                "7zz",
                                "7z.exe"
                            ];

                            const _7zBinaryLocations = [
                                "C:\\Program Files\\7-Zip\\7z.exe",
                                "C:\\Program Files (x86)\\7-Zip\\7z.exe"
                            ];

                            let _7zBinaryPath = _7zBinaryLocations.find(_7zPath => fs.existsSync(_7zPath));
                            
                            if (!_7zBinaryPath) {
                                _7zBinaryPath = _7zBinaries.reduce((_7zBinaryPath, _7zBinaryPathGuess) => {
                                    try {
                                        _7zBinaryPath = which.sync(_7zBinaryPathGuess);
                                    } catch (_err) {}

                                    return _7zBinaryPath;
                                }, _7zBinaryPath);
                            }

                            if (!_7zBinaryPath) {
                                // Fall back to bundled 7-Zip binary if it's not found on system
                                // TODO - Warn user about opening RARs if 7-Zip not installed on machine
                                _7zBinaryPath = sevenBin.path7za;
                            }

                            const decompressStream = Seven.extractFull(filePath, modDirStagingPath, { $bin: _7zBinaryPath });

                            decompressStream.on("data", ({ file }) => {
                                modFilePaths.push(file);
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
                    try {
                        return this.beginModImport(profile, modName, modDirStagingPath, modFilePaths, false);
                    } catch (err) {
                        log.error(`Error occurred while adding mod ${modName}: `, err);

                        // Erase the staging data
                        await fsPromises.rm(modDirStagingPath, { force: true });

                        throw err;
                    }
                }
            }

            return null;
        });

        ipcMain.handle("profile:beginModExternalImport", async (
            _event,
            /** @type {AppMessageData<"profile:beginModExternalImport">} */ { profile, modPath }
        ) => {
            if (!modPath) {
                const pickedModFolder = await dialog.showOpenDialog({
                    properties: ["openDirectory"]
                });
                
                modPath = pickedModFolder?.filePaths[0];
            }

            const folderPath = modPath ?? "";
            if (!!folderPath) {
                const modName = path.basename(folderPath);
                const modFilePaths = (await recursiveReaddir(folderPath)).map((filePath) => {
                    return filePath.replace(`${folderPath}${path.sep}`, "");
                });

                return this.beginModImport(profile, modName, folderPath, modFilePaths, true);
            }
        });

        ipcMain.handle("profile:completeModImport", async (
            _event,
            /** @type {AppMessageData<"profile:completeModImport">} */ { importRequest }
        ) => {
            return this.completeModImport(importRequest);
        });

        ipcMain.handle("profile:deleteMod", async (_event, /** @type {AppMessageData<"profile:deleteMod">} */ { profile, modName }) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);

            await fs.remove(modDirPath);
        });

        ipcMain.handle("profile:renameMod", async (
            _event,
            /** @type {AppMessageData<"profile:renameMod">} */ { profile, modCurName, modNewName }
        ) => {
            const modCurDir = this.getProfileModDir(profile.name, modCurName);
            const modNewDir = this.getProfileModDir(profile.name, modNewName);

            await fs.move(modCurDir, modNewDir);
        });

        ipcMain.handle("profile:deploy", async (_event, /** @type {AppMessageData<"profile:deploy">} */ { profile }) => {
            return this.deployProfile(profile);
        });

        ipcMain.handle("profile:undeploy", async (_event, /** @type {AppMessageData<"profile:undeploy">} */ { profile }) => {
            return this.undeployProfile(profile);
        });

        ipcMain.handle("profile:showModInFileExplorer", async (
            _event,
            /** @type {AppMessageData<"profile:showModInFileExplorer">} */ { profile, modName }
        ) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);

            shell.openPath(path.resolve(modDirPath));
        });

        ipcMain.handle("profile:showModBaseDirInFileExplorer", async (
            _event,
            /** @type {AppMessageData<"profile:showModBaseDirInFileExplorer">} */ { profile }
        ) => {
            shell.openPath(path.resolve(profile.modBaseDir));
        });

        ipcMain.handle("profile:showGameBaseDirInFileExplorer", async (
            _event,
            /** @type {AppMessageData<"profile:showGameBaseDirInFileExplorer">} */ { profile }
        ) => {
            shell.openPath(path.resolve(profile.gameBaseDir));
        });

        ipcMain.handle("profile:showProfileBaseDirInFileExplorer", async (
            _event,
            /** @type {AppMessageData<"profile:showProfileBaseDirInFileExplorer">} */ { profile }
        ) => {
            const profileDir = this.getProfileDir(profile.name);

            shell.openPath(path.resolve(profileDir));
        });

        ipcMain.handle("profile:showProfileModsDirInFileExplorer", async (
            _event,
            /** @type {AppMessageData<"profile:showProfileModsDirInFileExplorer">} */ { profile }
        ) => {
            const profileModsDir = this.getProfileModsDir(profile.name);

            shell.openPath(path.resolve(profileModsDir));
        });

        ipcMain.handle("profile:launchGame", async (_event, /** @type {AppMessageData<"profile:launchGame">} */ { profile }) => {
            spawn(path.resolve(profile.gameBinaryPath), {
                detached: true,
                cwd: profile.gameBaseDir
            });
        });
    }

    initWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false, // TODO
                // Enable HMR in debug mode
                preload: DEBUG_MODE ? path.join(__dirname, "electron-watcher.js") : undefined
            }
        });

        // Open all renderer links in the user's browser instead of the app
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: "deny" };
        });
    
        this.loadApp();
    }

    loadApp() {
        // load the index.html of the app.
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
                        type: "separator"
                    },
                    {
                        label: "View Project Homepage",
                        click: () => shell.openExternal("https://github.com/lVlyke/starfield-mod-loader")
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: "quit"
                    }
                ]
            },

            {
                label: "Profile",
                submenu: [
                    {
                        label: "Add New Profile",
                        click: () => this.mainWindow.webContents.send("app:newProfile")
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Mods",
                        submenu: [
                            {
                                label: "Add Mod",
                                click: () => this.mainWindow.webContents.send("profile:beginModAdd")
                            },
                            {
                                label: "Import Mod",
                                click: () => this.mainWindow.webContents.send("profile:beginModExternalImport")
                            }
                        ]
                    },
                    {
                        label: "Profile Settings",
                        click: () => this.mainWindow.webContents.send("profile:settings")
                    },
                ]
            },

            ...this.createDebugMenuOption({
                label: "View",
                submenu: [
                    {
                       role: "toggleDevTools"
                    }
                ]
            }),

            {
                label: "Help",
                submenu: [
                    {
                        label: "View README",
                        click: () => shell.openExternal("https://github.com/lVlyke/starfield-mod-loader/blob/master/README.md")
                    },
                    {
                        label: "About Starfield Mod Loader",
                        click: () => this.showAppAboutInfo()
                    }
                ]
            }
        ]);
    }

    /** @returns {[Record<any, any>] | []} */
    createDebugMenuOption(/** @type {Record<any, any>} */ menuOption) {
        return DEBUG_MODE ? [menuOption] : [];
    }

    /**
     * @returns {AppSettingsUserCfg}
     */
    loadSettings() {
        const settingsSrc = fs.readFileSync(ElectronLoader.APP_SETTINGS_FILE);

        return JSON.parse(settingsSrc.toString("utf8"));
    }

    /** @returns {void} */
    saveSettings(/** @type {AppSettingsUserCfg} */ settings) {
        return fs.writeFileSync(
            path.join(ElectronLoader.APP_SETTINGS_FILE),
            JSON.stringify(settings)
        );
    }

    /** @returns {GameDatabase} */
    loadGameDatabase() {
        if (!fs.existsSync(ElectronLoader.GAME_DB_FILE)) {
            return {};
        }

        const dbSrc = fs.readFileSync(ElectronLoader.GAME_DB_FILE);

        return JSON.parse(dbSrc.toString("utf8"));
    }

    /** @returns {string} */
    getProfileDir(/** @type {string} */ profileName) {
        return path.join(ElectronLoader.APP_PROFILES_DIR, profileName);
    }

    /** @returns {string} */
    getProfileModsDir(/** @type {string} */ profileName) {
        return path.join(this.getProfileDir(profileName), ElectronLoader.PROFILE_MODS_DIR);
    }

    /** @returns {string} */
    getProfileModDir(/** @type {string} */ profileName, /** @type {string} */ modName) {
        return path.join(this.getProfileModsDir(profileName), modName);
    }

    /** @returns {AppProfile | null} */
    loadProfile(/** @type {string} */ name) {
        const profileDir = this.getProfileDir(name);
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;
        const profileSettingsPath = path.join(profileDir, profileSettingsName);

        if (!fs.existsSync(profileSettingsPath)) {
            return null;
        }

        const profileSrc = fs.readFileSync(profileSettingsPath);
        const profile = JSON.parse(profileSrc.toString("utf8"));

        // Deserialize `mods` entries to Map
        profile.mods = new Map(profile.mods);

        return { name, ...profile };
    }

    /** @returns {void} */
    saveProfile(/** @type {AppProfile} */ profile, options) {
        const profileDir = this.getProfileDir(profile.name);
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;

        // Serialize `mods` Map as entries
        const profileToWrite = Object.assign({}, profile, { mods: Array.from(profile.mods.entries()) });

        // Make sure the profile and mods directory exists
        fs.mkdirpSync(this.getProfileModsDir(profile.name));

        return fs.writeFileSync(
            path.join(profileDir, profileSettingsName),
            JSON.stringify(_.omit(profileToWrite, ["name"])),
            options
        );
    }

    /** @returns {void} */
    deleteProfile(/** @type {AppProfile} */ profile) {
        const profileDir = this.getProfileDir(profile.name);

        return fs.rmdirSync(profileDir, { recursive: true });
    }

    /** @returns {ModImportRequest} */
    beginModImport(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ modName,
        /** @type {string} */ modImportPath,
        /** @type {string[]} */ modFilePaths,
        /** @type {boolean} */ externalImport
    ) {
        const modDataDirs = ["Data", "data"];
        const modSubdirRoot = modDataDirs.find(dataDir => fs.existsSync(path.join(modImportPath, dataDir))) ?? "";

        return {
            profile,
            modName,
            externalImport,
            importStatus: "PENDING",
            mergeStrategy: "REPLACE",
            modFilePaths: modFilePaths.map(filePath => ({
                filePath: filePath.replace(/[\\/]/g, path.sep),
                enabled: true
            })),
            modPath: modImportPath,
            filePathSeparator: path.sep,
            modSubdirRoot
        };
    }

    /** @returns {Promise<ModImportResult | undefined>} */
    async completeModImport(
        /** @type {ModImportRequest} */ {
            profile,
            modName,
            modPath,
            externalImport,
            importStatus,
            mergeStrategy,
            modFilePaths,
            modSubdirRoot
        }
    ) {
        try {
            // If the import status is anything except `PENDING`, an error occurred. 
            if (importStatus !== "PENDING") {
                return undefined;
            }

            const modProfilePath = this.getProfileModDir(profile.name, modName);
            const enabledModFiles =  modFilePaths.filter(({ enabled, filePath }) => {
                return enabled && filePath.startsWith(modSubdirRoot);
            });

            if (mergeStrategy === "REPLACE") {
                // Clear the mod dir for the profile
                fs.rmSync(modProfilePath, { recursive: true, force: true });
            }

            // Copy all enabled files to the final mod folder
            enabledModFiles.map(({ filePath }) => fs.copySync(
                path.join(modPath, filePath),
                path.join(modProfilePath, filePath.replace(modSubdirRoot, "")), {
                    errorOnExist: false,
                    overwrite: mergeStrategy === "OVERWRITE" || mergeStrategy === "REPLACE"
                }));
        } finally {
            if (!externalImport) {
                // Erase the staging data if this was added via archive
                await fs.remove(modPath);
            }
        }

        return {
            modName,
            modRef: { enabled: true }
        };
    }

    /** @returns {AppProfileModVerificationResult} */
    verifyProfileModsExist(/** @type {AppProfile} */ profile) {
        const modsDir = this.getProfileModsDir(profile.name);

        // @ts-ignore
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

    /** @returns {AppProfileVerificationResult} */
    verifyProfileModDirExists(/** @type {AppProfile} */ profile) {
        const modDirExists = fs.existsSync(profile.modBaseDir);
        return {
            error: false,
            found: modDirExists
        };
    }

    /** @returns {AppProfileVerificationResult} */
    verifyProfileGameDirExists(/** @type {AppProfile} */ profile) {
        const gameDirExists = fs.existsSync(profile.gameBaseDir);
        return {
            error: !gameDirExists,
            found: gameDirExists
        };
    }

    /** 
     * @description Determines whether or not **any** profile is deployed in the `modBaseDir` of `profile`.
     * @returns {boolean}
     * */
    isProfileDeployed(/** @type {AppProfile} */ profile) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);
        return fs.existsSync(metaFilePath);
    }

    /** @returns {ModDeploymentMetadata | undefined} */
    readProfileDeploymentMetadata(/** @type {AppProfile} */ profile) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);
        const metaFileExists = fs.existsSync(metaFilePath);

        if (!metaFileExists) {
            return undefined;
        }

        return JSON.parse(fs.readFileSync(metaFilePath).toString("utf-8"));
    }

    /** @returns {void} */
    writeProfileDeploymentMetadata(/** @type {AppProfile} */ profile, /** @type {ModDeploymentMetadata} */ deploymentMetadata) {
        const metaFilePath = path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);

        return fs.writeFileSync(metaFilePath, JSON.stringify(deploymentMetadata));
    }

    /** @returns {Promise<Array<string>>} */
    async findManualMods(/** @type {AppProfile} */ profile) {
        if (!fs.existsSync(profile.modBaseDir)) {
            return [];
        }

        let modDirFiles = (await recursiveReaddir(profile.modBaseDir)).map((filePath) => {
            return filePath.replace(`${profile.modBaseDir}${path.sep}`, "").toLowerCase();
        });

        if (this.isProfileDeployed(profile)) {
            const profileModFiles = this.readProfileDeploymentMetadata(profile)?.profileModFiles.map((filePath) => {
                return filePath.toLowerCase();
            });

            if (!profileModFiles) {
                throw new Error("Unable to read deployment metadata.");
            }
            
            modDirFiles = modDirFiles.filter(file => !profileModFiles.includes(file));
        }

        // Filter out directories
        return modDirFiles.filter((file) => !fs.lstatSync(path.join(profile.modBaseDir, file.toString())).isDirectory());
    }

    /** @returns {Promise<void>} */
    async deployProfile(/** @type {AppProfile} */ profile) {
        const profileModFiles = [];

        // Ensure the mod base dir exists
        fs.mkdirpSync(profile.modBaseDir);

        if (this.isProfileDeployed(profile)) {
            await this.undeployProfile(profile);
        }

        log.info("Deploying profile", profile.name);

        // Copy all mods to the modBaseDir for this profile
        // (Copy mods in reverse with `overwrite: false` to follow load order and allow existing manual mods in the folder to be preserved)
        const deployableModFiles = Array.from(profile.mods.entries()).reverse();
        for (const [modName, mod] of deployableModFiles) {
            if (mod.enabled) {
                const modDirPath = this.getProfileModDir(profile.name, modName);

                try {
                    fs.copySync(path.resolve(modDirPath), path.resolve(profile.modBaseDir), {
                        overwrite: false,
                        errorOnExist: false,
                        filter: (src, dest) => {
                            const modRelPath = dest.replace(`${profile.modBaseDir}${path.sep}`, "");
                            const isModSubDir = fs.lstatSync(path.resolve(src)).isDirectory();
                            const shouldCopy = isModSubDir
                                // Don't copy empty directories
                                ? fs.readdirSync(path.resolve(src)).length > 0
                                : true;

                            // Record mod files written from profile
                            if (shouldCopy && !isModSubDir && modRelPath.length > 0) {
                                profileModFiles.push(modRelPath);
                            }

                            return shouldCopy;
                        }
                    });
                } catch (err) {
                    log.error("Mod deployment failed: ", err);
                    throw err;
                }
            }
        }

        profileModFiles.push(ElectronLoader.PROFILE_METADATA_FILE);

        this.writeProfileDeploymentMetadata(profile, {
            profile: profile.name,
            profileModFiles
        });

        log.info("Mod deployment succeeded");
    }

    /** @returns {Promise<void>} */
    async undeployProfile(/** @type {AppProfile} */ profile) {
        if (!this.isProfileDeployed(profile)) {
            return;
        }

        log.info("Undeploying profile", profile.name);

        // @ts-ignore
        const { profileModFiles } = this.readProfileDeploymentMetadata(profile);

        // Only remove files managed by this profile
        const undeployJobs = profileModFiles.map(async (existingFile) => {
            const fullExistingPath = path.join(profile.modBaseDir, existingFile);

            if (fs.existsSync(fullExistingPath)) {
                await fsPromises.rm(fullExistingPath, { force: true, recursive: true });
            }

            // Recursively remove empty parent directories
            let existingDir = path.dirname(fullExistingPath);
            while (existingDir !== profile.modBaseDir && fs.existsSync(existingDir) && fs.readdirSync(existingDir).length === 0) {
                fs.rmdirSync(existingDir);
                existingDir = path.dirname(existingDir);
            }
        });

        // Wait for all files to be removed
        await Promise.all(undeployJobs);

        log.info("Mod undeployment succeeded");
    }

    showAppAboutInfo() {
        const depsLicenseText = fs.readFileSync(ElectronLoader.APP_DEPS_LICENSES_FILE).toString("utf-8");
        const depsInfo = JSON.parse(fs.readFileSync(ElectronLoader.APP_DEPS_INFO_FILE).toString("utf-8"));

        this.mainWindow.webContents.send("app:showAboutInfo", {
            depsLicenseText,
            depsInfo
        });
    }

    // Credit: https://stackoverflow.com/a/57253723
    /**
    * Replaces all environment variables with their actual value.
    * Keeps intact non-environment variables using '%'.
    * @param  {string} filePath The input file path with percents
    * @return {string}          The resolved file path
    */
    #resolveWindowsEnvironmentVariables(filePath) {
        if (!filePath || typeof (filePath) !== "string") {
            return "";
        }

        /**
         * @param  {string} withPercents    "%USERNAME%"
         * @param  {string} withoutPercents "USERNAME"
         * @return {string}
         */
        filePath = filePath.replace(/%([^%]+)%/g, (withPercents, withoutPercents) => {
            return process.env[withoutPercents] || withPercents;
        });

        return filePath;
    }
}

// Load the app
const loader = new ElectronLoader();