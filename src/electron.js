// @ts-check

/**
 * @typedef {import("./app/models/app-message").AppMessage} AppMessage;
 * @typedef {import("./app/models/app-resource").AppResource} AppResource;
 * @typedef {import("./app/models/app-profile").AppProfile} AppProfile;
 * @typedef {import("./app/models/app-profile").AppProfileVerificationResult} AppProfileVerificationResult;
 * @typedef {import("./app/models/app-profile").AppProfileVerificationResults} AppProfileVerificationResults;
 * @typedef {import("./app/models/app-profile").AppProfileModVerificationResults} AppProfileModVerificationResult;
 * @typedef {import("./app/models/app-profile").AppProfilePluginBackupEntry} AppProfilePluginBackupEntry;
 * @typedef {import("./app/models/app-profile").AppProfileDescription} AppProfileDescription;
 * @typedef {import("./app/models/app-profile").AppProfileExternalFiles} AppProfileExternalFiles;
 * @typedef {import("./app/models/mod-import-status").ModImportStatus} ModImportStatus;
 * @typedef {import("./app/models/mod-import-status").ModImportRequest} ModImportRequest;
 * @typedef {import("./app/models/mod-import-status").ModImportResult} ModImportResult;
 * @typedef {import("./app/models/app-settings-user-cfg").AppSettingsUserCfg} AppSettingsUserCfg;
 * @typedef {import("./app/models/game-database").GameDatabase} GameDatabase;
 * @typedef {import("./app/models/game-id").GameId} GameId;
 * @typedef {import("./app/models/game-details").GameDetails} GameDetails;
 * @typedef {import("./app/models/game-plugin-list-type").GamePluginListType} GamePluginListType;
 * @typedef {import("./app/models/mod-profile-ref").ModProfileRef} ModProfileRef;
 * @typedef {import("./app/models/mod-deployment-metadata").ModDeploymentMetadata} ModDeploymentMetadata;
 * @typedef {import("./app/models/fomod").Fomod.ModuleInfo} FomodModuleInfo;
 * @typedef {import("./app/models/fomod").Fomod.ModuleConfig} FomodModuleConfig;
 * @typedef {import("./app/models/game-plugin-profile-ref").GamePluginProfileRef} GamePluginProfileRef;
 */

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require("electron");
const log = require("electron-log/main");
const url = require("url");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const fs = require("fs-extra");
const fsPromises = require("fs").promises;
const _ = require("lodash");
const Seven = require("node-7z");
const sevenBin = require("7zip-bin");
const which = require("which");
const xml2js = require("xml2js");
const mime = require("mime-types");
const winVersionInfo = require("win-version-info");
// @ts-ignore
const detectFileEncodingAndLanguage = /** @type {typeof import("detect-file-encoding-and-language").default} */ (
    require("detect-file-encoding-and-language")
);

const DEBUG_MODE = !app.isPackaged;
const BUILD_DATE_FILE = `${__dirname}/lastbuild.txt`;

class ElectronLoader {

    static /** @type {string} */ APP_SETTINGS_FILE = "settings.json";
    static /** @type {string} */ APP_PROFILES_DIR = "profiles";
    static /** @type {string} */ APP_DEPS_LICENSES_FILE = path.join(__dirname, "3rdpartylicenses.txt");
    static /** @type {string} */ APP_DEPS_INFO_FILE = path.join(__dirname, "3rdpartylicenses.json");
    static /** @type {string} */ GAME_DB_FILE = path.join(__dirname, "game-db.json");
    static /** @type {string} */ GAME_RESOURCES_DIR = path.join(__dirname, "resources");
    static /** @type {string} */ PROFILE_SETTINGS_FILE = "profile.json";
    static /** @type {string} */ PROFILE_METADATA_FILE = ".sml.json";
    static /** @type {string} */ PROFILE_MODS_DIR = "mods";
    static /** @type {string} */ PROFILE_CONFIG_DIR = "config";
    static /** @type {string} */ PROFILE_BACKUPS_DIR = "backups";
    static /** @type {string} */ PROFILE_BACKUPS_PLUGINS_DIR = "plugins";
    static /** @type {string} */ PROFILE_MODS_STAGING_DIR = "_tmp";
    static /** @type {string} */ PROFILE_LINK_SUPPORT_TEST_FILE = ".sml_link_test";
    static /** @type {string} */ DEPLOY_EXT_BACKUP_DIR = ".sml.bak";

    static /** @type {Record<AppResource, string>} */ APP_RESOURCES = {
        "readme_offline": `file://${process.cwd()}/README.md`,
        "readme_online": "https://github.com/lVlyke/starfield-mod-loader/blob/master/README.md",
        "license": `file://${process.cwd()}/LICENSE`,
        "homepage": "https://github.com/lVlyke/starfield-mod-loader"
    };
    
    /** @type {BrowserWindow} */ mainWindow;
    /** @type {Menu} */ menu;
    /** @type {Record<string, any>} */ monitoredPaths = {};
    /** @type {Record<string, boolean>} */ ignorePathChanges = {};

    constructor() {
        log.initialize();
        
        if (DEBUG_MODE) {
            log.transports.console.level = "debug";
        }

        log.transports.file.level = DEBUG_MODE ? "info" : "debug";
        log.transports.file.resolvePathFn = () => "app.log";

        this.menu = this.createMenu();
        Menu.setApplicationMenu(this.menu);

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

        ipcMain.handle("app:syncUiState", (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:syncUiState">} */ {
                appState,
                modListCols,
                defaultModListCols
            }
        ) => {
            // Update window title
            if (appState.activeProfile) {
                const gameId = appState.activeProfile.gameId;
                const gameTitle = appState.gameDb[gameId]?.title ?? gameId ?? "Unknown";

                this.mainWindow.setTitle(`${appState.activeProfile.name} [${gameTitle}] - SML`);
            }

            // Sync mod list column menu checkbox state
            const activeModListCols = appState.modListColumns ?? defaultModListCols;
            modListCols.forEach((col) => {
                const colMenuItem = this.menu.getMenuItemById(`mod-list-col-${col}`);
                if (colMenuItem) {
                    colMenuItem.checked = activeModListCols.includes(col);
                }
            });
        });

        ipcMain.handle("app:chooseDirectory", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:chooseDirectory">} */ { baseDir }
        ) => {
            const result = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: baseDir
            });
            
            return result?.filePaths?.[0];
        });

        ipcMain.handle("app:chooseFilePath", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:chooseFilePath">} */ { baseDir, fileTypes }
        ) => {
            const result = await dialog.showOpenDialog({
                filters: fileTypes ? [
                    {
                        name: `Files (${fileTypes.length === 1 ? fileTypes[0] : fileTypes.join(", ")})`,
                        extensions: fileTypes
                    }
                ] : [],
                defaultPath: baseDir
            });
            
            return result?.filePaths?.[0];
        });

        ipcMain.handle("app:verifyPathExists", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:verifyPathExists">} */ data
        ) => {
            const paths = Array.isArray(data.path) ? data.path : [data.path]
            return this.#firstValidPath(paths, data.dirname ? curPath => path.dirname(curPath) : undefined);
        });

        ipcMain.handle("app:openFile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:openFile">} */ data
        ) => {
            data.path = this.#expandPath(path.resolve(data.path));
            const mimeType = mime.contentType(path.extname(data.path));

            const fileData = fs.readFileSync(data.path);

            return {
                mimeType,
                path: data.path,
                data: fileData,
            };
        });

        ipcMain.handle("app:loadProfileList", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:loadProfileList">} */ _data
        ) => {
            try {
                return this.loadProfileList();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:loadSettings", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:loadSettings">} */ _data
        ) => {
            try {
                return this.loadSettings();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:saveSettings", async (
            _event, 
            /** @type {import("./app/models/app-message").AppMessageData<"app:saveSettings">} */ { settings }
        ) => {
           return this.saveSettings(settings);
        });

        ipcMain.handle("app:loadGameDatabase", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:loadGameDatabase">} */ _data
        ) => {
            try {
                return this.loadGameDatabase();
            } catch (e) {
                log.error(e);
                return null;
            }
        });

        ipcMain.handle("app:resolveResourceUrl", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:resolveResourceUrl">} */ { resource }
        ) => {
            return ElectronLoader.APP_RESOURCES[resource];
        });

        ipcMain.handle("app:loadProfile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:loadProfile">} */ { name, gameId }
        ) => {
            return this.loadProfile(name);
        });

        ipcMain.handle("app:loadExternalProfile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:loadExternalProfile">} */ { profilePath }
        ) => {
            if (!profilePath) {
                const pickedFile = (await dialog.showOpenDialog({
                    properties: ["openDirectory"]
                }));
                
                profilePath = pickedFile?.filePaths[0];
            }

            if (profilePath) {
                profilePath = path.resolve(profilePath); // Make sure path is absolute
                return this.loadProfileFromPath(profilePath, profilePath);
            }
        });

        ipcMain.handle("app:saveProfile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:saveProfile">} */ { profile }
        ) => {
            return this.saveProfile(profile);
        });

        ipcMain.handle("app:deleteProfile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:deleteProfile">} */ { profile }
        ) => {
            return this.deleteProfile(profile);
        });

        ipcMain.handle("app:copyProfileData", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:copyProfileData">} */ { srcProfile, destProfile }
        ) => {
            log.info("Copying profile src: ", srcProfile.name, " dest: ", destProfile.name);

            const srcModsDir = this.getProfileModsDir(srcProfile.name);
            const destModsDir = this.getProfileModsDir(destProfile.name);

            // Copy profile mods
            if (fs.existsSync(srcModsDir)) {
                fs.mkdirpSync(destModsDir);
                fs.copySync(srcModsDir, destModsDir);
            }

            const srcConfigDir = this.getProfileConfigDir(srcProfile.name);
            const destConfigDir = this.getProfileConfigDir(destProfile.name);

            // Copy config files
            if (fs.existsSync(srcConfigDir)) {
                fs.mkdirpSync(destConfigDir);
                fs.copySync(srcConfigDir, destConfigDir);
            }

            // Copy plugin order backups
            const srcBackupsDir = this.getProfileBackupsDir(srcProfile.name);
            if (fs.existsSync(srcBackupsDir)) {
                const destBackupsDir = this.getProfileBackupsDir(destProfile.name);

                fs.mkdirpSync(destBackupsDir);
                fs.copySync(srcBackupsDir, destBackupsDir);
            }
        });

        ipcMain.handle("app:verifyProfile", /** @returns {Promise<AppProfileVerificationResults>} */ async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:verifyProfile">} */ { profile }
        ) => {
            const VERIFY_SUCCESS = { error: false, found: true };

            const profileExistsResult = this.verifyProfilePathExists(this.getProfileDir(profile.name));
            const modVerifyResult = this.verifyProfileModsExist(false, profile);
            const rootModVerifyResult = this.verifyProfileModsExist(true, profile);
            const modDirVerifyResult = this.verifyProfilePathExists(profile.modBaseDir);
            const gameDirVerifyResult = this.verifyProfilePathExists(profile.gameBaseDir);
            const gameBinaryPathVerifyResult = this.verifyProfilePathExists(profile.gameBinaryPath);
            const pluginListPathVerifyResult = profile.pluginListPath ? this.verifyProfilePathExists(profile.pluginListPath) : VERIFY_SUCCESS;
            const configFilePathVerifyResult = profile.configFilePath ? this.verifyProfilePathExists(profile.configFilePath) : VERIFY_SUCCESS;

            if (!profile.deployed) {
                gameBinaryPathVerifyResult.error = false;
            }
            
            if (!profile.deployed || !profile.plugins?.length) {
                pluginListPathVerifyResult.error = false;
            }

            const preparedResult = {
                name: VERIFY_SUCCESS,
                gameId: VERIFY_SUCCESS, // TODO
                gameBaseDir: gameDirVerifyResult,
                modBaseDir: modDirVerifyResult,
                gameBinaryPath: gameBinaryPathVerifyResult,
                pluginListPath: pluginListPathVerifyResult,
                configFilePath: configFilePathVerifyResult,
                mods: modVerifyResult,
                rootMods: rootModVerifyResult,
                plugins: { ...VERIFY_SUCCESS, results: {} }, // TODO
                externalFilesCache: VERIFY_SUCCESS,
                manageExternalPlugins: VERIFY_SUCCESS,
                manageConfigFiles: VERIFY_SUCCESS,
                linkMode: VERIFY_SUCCESS, // TODO
                deployed: VERIFY_SUCCESS
            };

            return {
                ...preparedResult,
                error: Object.values(preparedResult).some(curResult => curResult.error),
                found: profileExistsResult.found
            };
        });

        ipcMain.handle("app:findBestProfileDefaults", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"app:findBestProfileDefaults">} */ { gameId }
        ) => {
            const gameDb = this.loadGameDatabase();
            const gameDetails = gameDb[gameId];
            const result = {};

            if (gameDetails?.modBaseDirs) {
                result.modBaseDir = this.#firstValidPath(gameDetails.modBaseDirs);
            }

            if (gameDetails?.gameBaseDirs) {
                result.gameBaseDir = this.#firstValidPath(gameDetails.gameBaseDirs);
            }

            if (!!gameDetails?.gameBinary && result.gameBaseDir !== undefined) {
                const binaryPath = result.gameBaseDir;
                result.gameBinaryPath = this.#firstValidPath(gameDetails.gameBinary.reverse().map(binaryName => path.join(binaryPath, binaryName)));
            }

            if (gameDetails?.pluginListPaths) {
                result.pluginListPath = this.#firstValidPath(gameDetails.pluginListPaths, listPath => path.dirname(listPath));
            }

            if (gameDetails?.configFilePaths) {
                result.configFilePath = this.#firstValidPath(gameDetails.configFilePaths);
            }

            return result;
        });

        ipcMain.handle("profile:findExternalFiles", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:findExternalFiles">} */ { profile }
        ) => {
            return this.findProfileExternalFiles(profile);
        });

        ipcMain.handle("profile:findDeployedProfile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:findDeployedProfile">} */ { refProfile }
        ) => {
            return this.readProfileDeploymentMetadata(refProfile)?.profile;
        });

        ipcMain.handle("profile:beginModAdd", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:beginModAdd">} */ { profile, modPath, root }
        ) => {
            if (modPath) {
                log.info("Adding mod: ", modPath);
            } else {
                log.info("Adding new mod");
            }

            return this.beginModAdd(profile, root ?? false, modPath);
        });

        ipcMain.handle("profile:beginModExternalImport", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:beginModExternalImport">} */ { profile, modPath, root }
        ) => {
            if (modPath) {
                log.info("Importing mod: ", modPath);
            } else {
                log.info("Importing new mod");
            }
            
            return this.beginModExternalImport(profile, root ?? false, modPath);
        });

        ipcMain.handle("profile:completeModImport", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:completeModImport">} */ { importRequest }
        ) => {
            return this.completeModImport(importRequest);
        });

        ipcMain.handle("profile:deleteMod", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:deleteMod">} */ { profile, modName }
        ) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);
            log.info("Deleting mod: ", modDirPath);

            await fs.remove(modDirPath);
        });

        ipcMain.handle("profile:renameMod", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:renameMod">} */ { profile, modCurName, modNewName }
        ) => {
            const modCurDir = this.getProfileModDir(profile.name, modCurName);
            const modNewDir = this.getProfileModDir(profile.name, modNewName);

            await fs.move(modCurDir, modNewDir);
        });

        ipcMain.handle("profile:readModFilePaths", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:readModFilePaths">} */ { profile, modName, normalizePaths }
        ) => {
            return this.readModFilePaths(profile, modName, normalizePaths);
        });

        ipcMain.handle("profile:findPluginFiles", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:findPluginFiles">} */ { profile }
        ) => {
            return this.findPluginFiles(profile);
        });

        ipcMain.handle("profile:importPluginBackup", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:importPluginBackup">} */ { profile, backupPath }
        ) => {
            return this.importProfilePluginBackup(profile, backupPath);
        });

        ipcMain.handle("profile:createPluginBackup", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:createPluginBackup">} */ { profile, backupName }
        ) => {
            return this.createProfilePluginBackup(profile, backupName);
        });

        ipcMain.handle("profile:deletePluginBackup", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:deletePluginBackup">} */ { profile, backupFile }
        ) => {
            return this.deleteProfilePluginBackup(profile, backupFile);
        });

        ipcMain.handle("profile:readPluginBackups", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:readPluginBackups">} */ { profile }
        ) => {
            return this.readProfilePluginBackups(profile);
        });

        ipcMain.handle("profile:exportPluginList", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:exportPluginList">} */ { profile }
        ) => {
            const pickedFile = await dialog.showSaveDialog({
                filters: [
                    { 
                        name: "Plugin List", extensions: ["txt", "*"]
                    }
                ]
            });
            
            const pluginListPath = pickedFile?.filePath;
            if (pluginListPath) {
                return this.exportProfilePluginList(profile, pluginListPath);
            }
        });

        ipcMain.handle("profile:checkArchiveInvalidationEnabled", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:checkArchiveInvalidationEnabled">} */ {profile}
        ) => {
            return this.checkArchiveInvalidationEnabled(profile);
        });

        ipcMain.handle("profile:setArchiveInvalidationEnabled", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:setArchiveInvalidationEnabled">} */ { profile, enabled }
        ) => {
            return this.setArchiveInvalidationEnabled(profile, enabled);
        });

        ipcMain.handle("profile:deploy", async (_event, /** @type {import("./app/models/app-message").AppMessageData<"profile:deploy">} */ {
            profile, deployPlugins, normalizePathCasing
        }) => {
            return this.deployProfile(profile, deployPlugins, normalizePathCasing);
        });

        ipcMain.handle("profile:undeploy", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:undeploy">} */ { profile }
        ) => {
            return this.undeployProfile(profile);
        });

        ipcMain.handle("profile:showModInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showModInFileExplorer">} */ { profile, modName }
        ) => {
            const modDirPath = this.getProfileModDir(profile.name, modName);

            shell.openPath(path.resolve(modDirPath));
        });

        ipcMain.handle("profile:showModBaseDirInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showModBaseDirInFileExplorer">} */ { profile }
        ) => {
            shell.openPath(path.resolve(this.#expandPath(profile.modBaseDir)));
        });

        ipcMain.handle("profile:showGameBaseDirInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showGameBaseDirInFileExplorer">} */ { profile }
        ) => {
            shell.openPath(path.resolve(this.#expandPath(profile.gameBaseDir)));
        });

        ipcMain.handle("profile:showProfileBaseDirInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showProfileBaseDirInFileExplorer">} */ { profile }
        ) => {
            const profileDir = this.getProfileDir(profile.name);

            shell.openPath(path.resolve(profileDir));
        });

        ipcMain.handle("profile:showProfileModsDirInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showProfileModsDirInFileExplorer">} */ { profile }
        ) => {
            const profileModsDir = this.getProfileModsDir(profile.name);

            shell.openPath(path.resolve(profileModsDir));
        });

        ipcMain.handle("profile:showProfileConfigDirInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showProfileConfigDirInFileExplorer">} */ { profile }
        ) => {
            const profileConfigDir = path.resolve(this.getProfileConfigDir(profile.name));

            if (fs.existsSync(profileConfigDir)) {
                shell.openPath(profileConfigDir);
            }
        });

        ipcMain.handle("profile:showProfilePluginBackupsInFileExplorer", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:showProfilePluginBackupsInFileExplorer">} */ { profile }
        ) => {
            const profileModsDir = this.getProfilePluginBackupsDir(profile.name);

            shell.openPath(path.resolve(profileModsDir));
        });

        ipcMain.handle("profile:launchGame", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:launchGame">} */ { profile }
        ) => {
            let binaryPath = profile.gameBinaryPath;

            // If binary path is relative, use the `gameBaseDir` as the binary dir
            if (!path.isAbsolute(binaryPath)) {
                binaryPath = path.join(this.#expandPath(profile.gameBaseDir), binaryPath);
            }

            spawn(path.resolve(binaryPath), {
                detached: true,
                cwd: this.#expandPath(profile.gameBaseDir)
            });
        });

        ipcMain.handle("profile:openGameConfigFile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:openGameConfigFile">} */ { configPaths }
        ) => {
            await this.openGameConfigFile(configPaths);
        });

        ipcMain.handle("profile:openProfileConfigFile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:openProfileConfigFile">} */ { profile, configFileName }
        ) => {
            const profileConfigFilePath = this.getGameConfigFilePath(profile, configFileName);

            if (!!profileConfigFilePath && fs.existsSync(profileConfigFilePath)) {
                return shell.openPath(path.resolve(profileConfigFilePath));
            }
        });

        ipcMain.handle("profile:readConfigFile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:readConfigFile">} */ { profile, fileName, loadDefaults }
        ) => {
            return this.readProfileConfigFile(profile, fileName, loadDefaults);
        });

        ipcMain.handle("profile:updateConfigFile", async (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:updateConfigFile">} */ { profile, fileName, data }
        ) => {
            this.updateProfileConfigFile(profile, fileName, data);
        });

        ipcMain.handle("profile:linkModeSupported", (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:linkModeSupported">} */ { profile }
        ) => {
            const modBaseDir = profile?.modBaseDir ? this.#expandPath(profile.modBaseDir) : undefined;
            const gameBaseDir = profile?.gameBaseDir ? this.#expandPath(profile.gameBaseDir) : undefined;

            if (!profile || !modBaseDir || !gameBaseDir) {
                return false;
            }

            const testFileSrc = ElectronLoader.PROFILE_LINK_SUPPORT_TEST_FILE;
            const modDirTestFileDest = path.join(modBaseDir, ElectronLoader.PROFILE_LINK_SUPPORT_TEST_FILE);
            const gameDirTestFileDest = path.join(gameBaseDir, ElectronLoader.PROFILE_LINK_SUPPORT_TEST_FILE);

            try {
                if (!fs.existsSync(testFileSrc)) {
                    fs.writeFileSync(testFileSrc, "");
                }

                if (!fs.existsSync(modBaseDir)) {
                    fs.mkdirpSync(modBaseDir);
                }

                // Create a test link to modBaseDir
                fs.linkSync(testFileSrc, modDirTestFileDest);

                if (modDirTestFileDest !== gameDirTestFileDest) {
                    if (!fs.existsSync(gameBaseDir)) {
                        fs.mkdirpSync(gameBaseDir);
                    }

                    // Create a test link to gameBaseDir
                    fs.linkSync(testFileSrc, gameDirTestFileDest);
                }

                return true;
            } catch (err) {
                log.info("Link mode not supported reason: ", err);
                return false;
            } finally {
                try {
                    fs.rmSync(modDirTestFileDest);
                } catch (err) {}

                try {
                    fs.rmSync(gameDirTestFileDest);
                } catch (err) {}

                try {
                    fs.rmSync(testFileSrc);
                } catch (err) {}
            }

            return false;
        });

        ipcMain.handle("profile:resolveGameBinaryVersion", (
            _event,
            /** @type {import("./app/models/app-message").AppMessageData<"profile:resolveGameBinaryVersion">} */ { profile }
        ) => {
            const gameBaseDir = profile.gameBaseDir ? this.#expandPath(profile.gameBaseDir) : undefined;

            if (!gameBaseDir) {
                return undefined;
            }

            const gameDetails = this.#getGameDetails(profile.gameId);
            if (!gameDetails) {
                return undefined;
            }

            const gameBinaryName = gameDetails.gameBinary.find(binaryName => fs.existsSync(path.join(gameBaseDir, binaryName)));
            if (!gameBinaryName) {
                return undefined;
            }

            const gameBinaryPath = path.join(gameBaseDir, gameBinaryName);
            const gameBinaryVersionInfo = winVersionInfo(gameBinaryPath);
            
            return gameBinaryVersionInfo?.FileVersion;
        });
    }

    initWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "electron-preload.js")
            }
        });

        // Enable HMR in debug mode
        if (DEBUG_MODE) {
            this.enableHotReload();
        }

        // Load the web app
        this.loadApp();

        // Disable page navigation
        this.mainWindow.webContents.on("will-navigate", (event) => {
            event.preventDefault();
        });

        // Open all renderer links in the user's browser instead of the app
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: "deny" };
        });
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

    enableHotReload() {
        const chokidar = require("chokidar");

        chokidar.watch(BUILD_DATE_FILE, {
            interval: 500,
            usePolling: true,
            awaitWriteFinish: true,
            ignoreInitial: true
        }).on("change", () => {
            console.info("Changes detected, reloading app...");
    
            this.loadApp();

            console.info("App reloaded");
        });
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
                        click: () => shell.openExternal(ElectronLoader.APP_RESOURCES["homepage"])
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
                        label: "Import Profile",
                        click: () => this.mainWindow.webContents.send("app:importProfile")
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
                            },
                            {
                                label: "Add Root Mod",
                                click: () => this.mainWindow.webContents.send("profile:beginModAdd", { root: true })
                            },
                            {
                                label: "Import Root Mod",
                                click: () => this.mainWindow.webContents.send("profile:beginModExternalImport", { root: true })
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
                label: "View",
                submenu: [
                    {
                        label: "Mod List Columns",
                        submenu: [
                            {
                                id: "mod-list-col-enabled",
                                type: "checkbox",
                                label: "Mod Enabled",
                                checked: false,
                                click: () => this.mainWindow.webContents.send("app:toggleModListColumn", { column: "enabled" })
                            },
                            {
                                id: "mod-list-col-name",
                                type: "checkbox",
                                label: "Mod Name",
                                checked: false,
                                enabled: false,
                            },
                            {
                                id: "mod-list-col-updatedDate",
                                type: "checkbox",
                                label: "Mod Updated Date",
                                checked: false,
                                click: () => this.mainWindow.webContents.send("app:toggleModListColumn", { column: "updatedDate" })
                            },
                            {
                                id: "mod-list-col-order",
                                type: "checkbox",
                                label: "Mod Order",
                                checked: false,
                                click: () => this.mainWindow.webContents.send("app:toggleModListColumn", { column: "order" })
                            },
                            {
                                type: "separator"
                            },
                            {
                                label: "Reset Defaults",
                                click: () => this.mainWindow.webContents.send("app:toggleModListColumn", { reset: true })
                            }
                        ]
                    },
                    ...this.createDebugMenuOption({
                        type: "separator"
                     }),
                     ...this.createDebugMenuOption({
                        role: "toggleDevTools"
                     })
                ]
            },

            {
                label: "Help",
                submenu: [
                    {
                        label: "View README",
                        click: () => shell.openExternal(ElectronLoader.APP_RESOURCES["readme_online"])
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
     * @returns {AppProfileDescription[]}
     */
    loadProfileList() {
        if (!fs.existsSync(ElectronLoader.APP_PROFILES_DIR)) {
            return [];
        }

        const profileNames = _.sortBy(fs.readdirSync(ElectronLoader.APP_PROFILES_DIR));
        return profileNames.map((profileName) => {
            const profile = this.loadProfile(profileName);
            return {
                name: profileName,
                gameId: profile?.gameId ?? "$unknown",
                deployed: profile?.deployed ?? false
            };
        });
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

    /** @returns {GameDatabase | {}} */
    loadGameDatabase() {
        if (!fs.existsSync(ElectronLoader.GAME_DB_FILE)) {
            return {};
        }

        const dbSrc = fs.readFileSync(ElectronLoader.GAME_DB_FILE);

        return JSON.parse(dbSrc.toString("utf8"));
    }

    /** @returns {string} */
    getProfileDir(/** @type {string} */ profileNameOrPath) {
        return path.isAbsolute(profileNameOrPath)
            ? profileNameOrPath
            : this.#expandPath(path.join(ElectronLoader.APP_PROFILES_DIR, profileNameOrPath));
    }

    /** @returns {string} */
    getProfileConfigDir(/** @type {string} */ profileNameOrPath) {
        return path.join(this.getProfileDir(profileNameOrPath), ElectronLoader.PROFILE_CONFIG_DIR);
    }

    /** @returns {string} */
    getProfileModsDir(/** @type {string} */ profileNameOrPath) {
        return path.join(this.getProfileDir(profileNameOrPath), ElectronLoader.PROFILE_MODS_DIR);
    }

    /** @returns {string} */
    getProfileTmpDir(/** @type {string} */ profileNameOrPath) {
        return path.join(this.getProfileDir(profileNameOrPath), ElectronLoader.PROFILE_MODS_STAGING_DIR);
    }

    /** @returns {string} */
    getProfileModDir(/** @type {string} */ profileNameOrPath, /** @type {string} */ modName) {
        return path.join(this.getProfileModsDir(profileNameOrPath), modName);
    }

    /** @returns {string} */
    getProfileBackupsDir(/** @type {string} */ profileNameOrPath) {
        return path.join(
            this.getProfileDir(profileNameOrPath), 
            ElectronLoader.PROFILE_BACKUPS_DIR
        );
    }

    /** @returns {string} */
    getProfilePluginBackupsDir(/** @type {string} */ profileNameOrPath) {
        return path.join(
            this.getProfileBackupsDir(profileNameOrPath),
            ElectronLoader.PROFILE_BACKUPS_PLUGINS_DIR
        );
    }

    /** @returns {AppProfile | null} */
    loadProfile(/** @type {string} */ profileNameOrPath) {
        return this.loadProfileFromPath(profileNameOrPath, this.getProfileDir(profileNameOrPath));
    }

    /** @returns {AppProfile | null} */
    loadProfileFromPath(/** @type {string} */ profileName, /** @type {string} */ profilePath) {
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;
        const profileSettingsPath = path.join(profilePath, profileSettingsName);

        if (!fs.existsSync(profileSettingsPath)) {
            return null;
        }

        const profileSrc = fs.readFileSync(profileSettingsPath);
        const profile = JSON.parse(profileSrc.toString("utf8"));
        profile.name = profileName;
        // Deserialize mods entries to Map
        profile.mods = new Map(profile.mods);
        profile.rootMods = new Map(profile.rootMods ?? []);
        // Update deployment status
        profile.deployed = this.isProfileDeployed(profile);

        return profile;
    }

    /** @returns {void} */
    saveProfile(/** @type {AppProfile} */ profile, options) {
        const profileDir = this.getProfileDir(profile.name);
        const profileSettingsName = ElectronLoader.PROFILE_SETTINGS_FILE;

        // Serialize root mods Map as entries
        const profileToWrite = Object.assign({}, profile, {
            mods: Array.from(profile.mods.entries()),
            rootMods: profile.rootMods ? Array.from(profile.rootMods.entries()) : []
        });

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

        return fs.rmSync(profileDir, { recursive: true });
    }

    /** @returns {string} */
    readProfileConfigFile(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ fileName,
        /** @type {boolean} */ loadDefaults
    ) {
        const profileConfigDir = this.getProfileConfigDir(profile.name);
        const profileConfigFilePath = path.join(profileConfigDir, fileName);
        
        if (!fs.existsSync(profileConfigFilePath)) {
            // Attempt to load default config values if profile file doesn't exist yet
            if (loadDefaults && !!profile.configFilePath) {
                const defaultConfigFilePath = path.join(profile.configFilePath, fileName);
                if (fs.existsSync(defaultConfigFilePath)) {
                    return fs.readFileSync(defaultConfigFilePath, "utf8");
                }
            }

            return "";
        }

        return fs.readFileSync(profileConfigFilePath, "utf8");
    }

    /** @returns {void} */
    updateProfileConfigFile(/** @type {AppProfile} */ profile, /** @type {string} */ fileName, /** @type {string} */ data) {
        const profileConfigDir = this.getProfileConfigDir(profile.name);
        const profileConfigFilePath = path.join(profileConfigDir, fileName);
        
        fs.mkdirpSync(profileConfigDir);
        fs.writeFileSync(profileConfigFilePath, data, "utf8");
    }

    /** @returns {AppProfile} */
    importProfilePluginBackup(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ backupPath
    ) {
        if (!path.isAbsolute(backupPath)) {
            backupPath = path.join(this.getProfilePluginBackupsDir(profile.name), backupPath);
        }

        /** @type {AppProfile["plugins"]} */ const pluginsBackup = fs.readJSONSync(backupPath);

        if (!Array.isArray(pluginsBackup)) {
            throw new Error("Invalid backup.");
        }

        // Only import plugins that already exist in the current plugin list
        let restoredPlugins = pluginsBackup.filter((restoredPlugin) => profile.plugins.some((existingPlugin) => {
            if (existingPlugin.plugin !== restoredPlugin.plugin) {
                return false;
            }

            // If plugin name matches but not mod ID, use the mod ID of the existing profile mod
            if (existingPlugin.modId !== restoredPlugin.modId) {
                restoredPlugin.modId = existingPlugin.modId;
            }

            return true;
        }));

        // Move any existing plugins that weren't in the backup to the bottom of the load order
        restoredPlugins.push(...profile.plugins.filter((existingPlugin) => !restoredPlugins.some((restoredPlugin) => {
            return existingPlugin.plugin === restoredPlugin.plugin && existingPlugin.modId === restoredPlugin.modId;
        })));
        
        // Return the updated profile
        return Object.assign({}, profile, { plugins: restoredPlugins });
    }

    /** @returns {void} */
    createProfilePluginBackup(
        /** @type {AppProfile} */ profile,
        /** @type {string | undefined} */ backupName
    ) {
        const backupsDir = this.getProfilePluginBackupsDir(profile.name);

        fs.mkdirpSync(backupsDir);

        fs.writeJSONSync(
            path.join(backupsDir, `${this.#asFileName(backupName || this.#currentDateTimeAsFileName())}.json`),
            profile.plugins,
            { spaces: 4 }
        );
    }

    /** @returns {void} */
    deleteProfilePluginBackup(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ backupPath
    ) {
        if (!path.isAbsolute(backupPath)) {
            backupPath = path.join(this.getProfilePluginBackupsDir(profile.name), backupPath);
        }

        fs.rmSync(backupPath);
    }

    /** @returns {AppProfilePluginBackupEntry[]} */
    readProfilePluginBackups(
        /** @type {AppProfile} */ profile
    ) {
        const backupsDir = this.getProfilePluginBackupsDir(profile.name);

        if (!fs.existsSync(backupsDir)) {
            return [];
        }

        return _.orderBy(fs.readdirSync(backupsDir)
            .filter(filePath => filePath.endsWith(".json"))
            .map((filePath) => ({
                filePath,
                backupDate: fs.lstatSync(path.join(backupsDir, filePath)).mtime
            })), "backupDate", "desc");
    }

    /** @returns {void} */
    exportProfilePluginList(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ pluginListPath
    ) {
        fs.writeFileSync(pluginListPath, this.#createProfilePluginList(profile));
    }

    /** @returns {Promise<ModImportRequest | undefined>} */
    async beginModAdd(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ root,
        /** @type {string | undefined} */ modPath,
    ) {
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
            if (fs.lstatSync(filePath).isDirectory()) {
                return this.beginModExternalImport(profile, root, filePath);
            }

            const fileType = path.extname(filePath);
            const modName = path.basename(filePath, fileType);
            const modDirStagingPath = path.join(this.getProfileTmpDir(profile.name), modName);
            /** @type Promise */ let decompressOperation;

            // Clear the staging dir
            fs.rmSync(modDirStagingPath, { recursive: true, force: true });

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
                            "7z",
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
                                    const which7zBinaryPath = which.sync(_7zBinaryPathGuess);
                                    _7zBinaryPath = (Array.isArray(which7zBinaryPath)
                                        ? which7zBinaryPath[0]
                                        : which7zBinaryPath
                                    ) ?? undefined;
                                } catch (_err) {}

                                return _7zBinaryPath;
                            }, _7zBinaryPath);
                        }

                        if (!_7zBinaryPath) {
                            // Fall back to bundled 7-Zip binary if it's not found on system
                            // TODO - Warn user about opening RARs if 7-Zip not installed on machine
                            _7zBinaryPath = sevenBin.path7za;

                            log.warn("7-Zip binary was not found on this machine. Falling back to bundled binary.");
                        } else {
                            log.info("Found 7-Zip binary: ", _7zBinaryPath);
                        }

                        const decompressStream = Seven.extractFull(filePath, modDirStagingPath, { $bin: _7zBinaryPath });
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
                    const modFilePaths = fs.readdirSync(modDirStagingPath, { encoding: "utf-8", recursive: true });
                    return await this.beginModImport(profile, root, modName, modDirStagingPath, modFilePaths, false);
                } catch (err) {
                    log.error(`Error occurred while adding mod ${modName}: `, err);

                    // Erase the staging data
                    await fsPromises.rm(modDirStagingPath, { force: true });

                    throw err;
                }
            }
        }

        return undefined;
    }

    /** @returns {Promise<ModImportRequest | undefined>} */
    async beginModExternalImport(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ root,
        /** @type {string | undefined} */ modPath
    ) {
        if (!modPath) {
            const pickedModFolder = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            
            modPath = pickedModFolder?.filePaths[0];
        }

        const folderPath = modPath ?? "";
        if (!!folderPath) {
            if (fs.lstatSync(folderPath).isFile()) {
                return this.beginModAdd(profile, root, folderPath);
            }

            const modName = path.basename(folderPath);
            const modFilePaths = await fs.readdir(folderPath, { encoding: "utf-8", recursive: true });

            return this.beginModImport(profile, root, modName, folderPath, modFilePaths, true);
        }

        return undefined;
    }

    /** @returns {Promise<ModImportRequest>} */
    async beginModImport(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ root,
        /** @type {string} */ modName,
        /** @type {string} */ modImportPath,
        /** @type {string[]} */ modFilePaths,
        /** @type {boolean} */ externalImport
    ) {
        const gameDb = this.loadGameDatabase();
        const gameDetails = gameDb[profile.gameId];
        const gamePluginFormats = gameDetails?.pluginFormats ?? [];
        const modDataDirs = ["Data", "data"];
        let modSubdirRoot = "";
        
        // Look for nested "data" dir for non-root mods
        if (!root) {
            modSubdirRoot = modDataDirs.find(dataDir => fs.existsSync(path.join(modImportPath, dataDir))) ?? "";
        }

        const modPreparedFilePaths = modFilePaths
            .filter(filePath => !fs.lstatSync(path.join(modImportPath, filePath)).isDirectory())
            .map(filePath => ({
                filePath: filePath.replace(/[\\/]/g, path.sep),
                enabled: true
            }));

        const modPlugins = [];
        modPreparedFilePaths.forEach(({ filePath }) => {
            if (gamePluginFormats.some(pluginFormat => filePath.toLowerCase().endsWith(pluginFormat))) {
                modPlugins.push(filePath);
            }
        });

        let installer = undefined;

        // Check if this mod is packaged as a FOMOD installer
        const fomodModuleInfoFile = modPreparedFilePaths.find(({ filePath }) => filePath.toLowerCase().endsWith(`fomod${path.sep}info.xml`));
        const fomodModuleConfigFile = modPreparedFilePaths.find(({ filePath }) => filePath.toLowerCase().endsWith(`fomod${path.sep}moduleconfig.xml`));
        if (!!fomodModuleInfoFile || !!fomodModuleConfigFile) {
            do {
                
                const xmlParser = new xml2js.Parser({
                    mergeAttrs: true,
                    trim: true,
                    emptyTag: undefined
                });
                /** @type {FomodModuleInfo | undefined} */ let fomodModuleInfo;
                /** @type {FomodModuleConfig | undefined} */ let fomodModuleConfig;

                // Parse info.xml (optional)
                if (fomodModuleInfoFile) {
                    try {
                        const fullInfoFilePath =  path.join(modImportPath, fomodModuleInfoFile.filePath);
                        const fileInfo = await detectFileEncodingAndLanguage(fullInfoFilePath);
                        const fileEncoding = /** @type {BufferEncoding} */ (fileInfo.encoding?.toLowerCase() ?? "utf-8");
                        const moduleInfoXml = fs.readFileSync(
                            fullInfoFilePath,
                            { encoding: fileEncoding }
                        );
                        fomodModuleInfo = await xmlParser.parseStringPromise(moduleInfoXml);
                    } catch (err) {
                        log.error(`${modName} - Failed to read FOMOD info.xml: `, err);
                    }
                }

                // Parse ModuleConfig.xml (optional)
                if (fomodModuleConfigFile) {
                    try {
                        const fullConfigFilePath =  path.join(modImportPath, fomodModuleConfigFile.filePath);
                        const fileInfo = await detectFileEncodingAndLanguage(fullConfigFilePath);
                        const fileEncoding = /** @type {BufferEncoding} */ (fileInfo.encoding?.toLowerCase() ?? "utf-8");
                        const moduleConfigXml = fs.readFileSync(
                            fullConfigFilePath,
                            { encoding: fileEncoding }
                        );
                        fomodModuleConfig = await xmlParser.parseStringPromise(moduleConfigXml);
                    } catch (err) {
                        log.error(`${modName} - Failed to read FOMOD ModuleConfig.xml: `, err);
                        break;
                    }

                    if (!fomodModuleConfig) {
                        log.error(`${modName} - Failed to read FOMOD ModuleConfig.xml`);
                        break;
                    }
                }

                // Map FOMOD installer to SML format
                try {
                    let moduleInfo = undefined;
                    if (fomodModuleInfo) {
                        moduleInfo = {
                            name: fomodModuleInfo.fomod.Name?.[0],
                            author: fomodModuleInfo.fomod.Author ?? [],
                            version: fomodModuleInfo.fomod.Version?.[0]?._ ?? fomodModuleInfo.fomod.Version?.[0],
                            description: fomodModuleInfo.fomod.Description?.[0],
                            website: fomodModuleInfo.fomod.Website?.[0],
                            id: fomodModuleInfo.fomod.Id?.[0],
                            categoryId: fomodModuleInfo.fomod.CategoryId ?? []
                        };
                    }

                    let moduleConfig = undefined;
                    if (fomodModuleConfig) {
                        moduleConfig = {
                            moduleName: fomodModuleConfig.config.moduleName[0],
                            moduleDependencies: fomodModuleConfig.config.moduleDependencies ?? [],
                            requiredInstallFiles: fomodModuleConfig.config.requiredInstallFiles ?? [],
                            installSteps: fomodModuleConfig.config.installSteps?.[0],
                            conditionalFileInstalls: fomodModuleConfig.config.conditionalFileInstalls?.[0],
                            moduleImage: fomodModuleConfig.config.moduleImage?.[0]
                        };
                    }
                    
                    installer = {
                        info: moduleInfo,
                        config: moduleConfig,
                        zeroConfig: !moduleConfig?.installSteps
                    };
                }  catch (err) {
                    log.error(`${modName} - Failed to parse FOMOD data: `, err);
                    break;
                }

                log.info(`${installer.info?.name ?? modName} - Found FOMOD installer`);

                // Update the root subdir to the parent dir of the `fomod` folder
                const fomodFilePath = (fomodModuleInfoFile ?? fomodModuleConfigFile)?.filePath;
                if (fomodFilePath) {
                    modSubdirRoot = path.dirname(path.dirname(fomodFilePath));
                    if (modSubdirRoot === ".") {
                        modSubdirRoot = "";
                    }
                }
            } while(false);
        }

        return {
            profile,
            root,
            modName,
            externalImport,
            importStatus: "PENDING",
            mergeStrategy: "REPLACE",
            modPlugins,
            modFilePaths: modPreparedFilePaths,
            modPath: modImportPath,
            filePathSeparator: path.sep,
            modSubdirRoot,
            installer
        };
    }

    /** @returns {Promise<ModImportResult | undefined>} */
    async completeModImport(
        /** @type {ModImportRequest} */ {
            profile,
            root,
            modName,
            modPath,
            externalImport,
            importStatus,
            mergeStrategy,
            modFilePaths,
            modSubdirRoot,
            modPlugins,
            modFilePathMapFilter
        }
    ) {
        try {
            // If the import status is anything except `PENDING`, an error occurred. 
            if (importStatus !== "PENDING") {
                return undefined;
            }

            // Collect all enabled mod files, K = file dest, V = file src
            /** @type {Map<string, string>} */ const enabledModFiles = modFilePaths.reduce((enabledModFiles, fileEntry) => {
                fileEntry.filePath = this.#expandPath(fileEntry.filePath);

                if (modFilePathMapFilter) {
                    // Check if a mapping entry exists for the current file path
                    const mappedEntry = Object.entries(modFilePathMapFilter).find(([pathMapSrcRaw]) => {
                        let pathMapSrcNorm = this.#expandPath(pathMapSrcRaw).toLowerCase();

                        if (!pathMapSrcNorm.startsWith(modSubdirRoot.toLowerCase())) {
                            pathMapSrcNorm = path.join(modSubdirRoot, pathMapSrcNorm).toLowerCase();
                        }

                        // Check if the mapping src is a direct match for the file
                        if (fileEntry.filePath.toLowerCase() === pathMapSrcNorm) {
                            return true;
                        }

                        if (!pathMapSrcNorm.endsWith(path.sep)) {
                            pathMapSrcNorm += path.sep;
                        }

                        // Check if the file is inside the mapping src dir
                        return fileEntry.filePath.toLowerCase().startsWith(pathMapSrcNorm);
                    });
                    fileEntry.enabled = !!mappedEntry;

                    if (mappedEntry) {
                        const mappedSrcPath = this.#expandPath(mappedEntry[0]);
                        const mappedDestPath = this.#expandPath(mappedEntry[1]);
                        // Map the file path to the destination path, excluding any root data dir
                        if (fileEntry.filePath.toLowerCase().startsWith(mappedSrcPath.toLowerCase())) {
                            fileEntry.mappedFilePath = `${mappedDestPath}${fileEntry.filePath.substring(mappedSrcPath.length)}`;
                            fileEntry.mappedFilePath = fileEntry.mappedFilePath.replace(/^[/\\]+/, "");
                            fileEntry.mappedFilePath = fileEntry.mappedFilePath.replace(/^[Dd]ata[\\/]/, "");
                        }
                    }
                } else {
                    fileEntry.enabled = fileEntry.enabled && fileEntry.filePath.toLowerCase().startsWith(modSubdirRoot.toLowerCase());
                }

                if (fileEntry.enabled) {
                    const destFilePath = fileEntry.mappedFilePath ?? fileEntry.filePath;
                    const existingEntry = enabledModFiles.get(destFilePath);
                    if (existingEntry) {
                        log.warn(
                            `${modName} - Installer provides multiple files that map to the same path: "${destFilePath}"`,
                            "\r\n",
                            `Overwriting "${existingEntry}" with "${fileEntry.filePath}"`
                        );
                    }

                    enabledModFiles.set(destFilePath, fileEntry.filePath);
                }

                return enabledModFiles;
            }, new Map());

            const modProfilePath = this.getProfileModDir(profile.name, modName);

            if (mergeStrategy === "REPLACE") {
                // Clear the mod dir for the profile
                fs.rmSync(modProfilePath, { recursive: true, force: true });
            }

            if (enabledModFiles.size > 0) {
                const overwriteExistingFiles = mergeStrategy === "OVERWRITE" || mergeStrategy === "REPLACE";
                const modFileOperations = [];

                for (let [destBasePath, srcFilePath] of enabledModFiles) {
                    srcFilePath = path.join(modPath, srcFilePath);

                    if (!fs.lstatSync(srcFilePath).isDirectory()) {
                        // Normalize path to the mod subdir root
                        const modSubdirPrefix = `${modSubdirRoot}${path.sep}`.toLowerCase();
                        let rootFilePath = destBasePath;
                        if (modSubdirRoot && rootFilePath.toLowerCase().startsWith(modSubdirPrefix)) {
                            rootFilePath = rootFilePath.slice(modSubdirPrefix.length);
                        }
                        
                        const destFilePath = path.join(modProfilePath, rootFilePath);
                        
                        // Copy all enabled files to the final mod folder
                        if (externalImport) {
                            // Copy files from external imports
                            modFileOperations.push(fs.copy(srcFilePath, destFilePath, {
                                errorOnExist: false,
                                overwrite: overwriteExistingFiles
                            }));
                        } else {
                            // Move files from the temp staging path for non-external imports
                            modFileOperations.push(fs.move(srcFilePath, destFilePath, {
                                overwrite: overwriteExistingFiles
                            }));
                        }
                    }
                }

                await Promise.all(modFileOperations);
            } else {
                fs.mkdirpSync(modProfilePath);
            }

            return {
                root,
                modName,
                modRef: {
                    enabled: true,
                    updatedDate: new Date().toISOString()
                }
            };
        } catch (err) {
            log.error("Mod import failed: ", err);
            throw err;
        } finally {
            if (!externalImport) {
                try {
                    // Erase the staging data if this was added via archive
                    await fs.remove(modPath);
                } catch (err) {
                    log.error(`${modName} - Failed to clean-up temporary installation files: `, err);

                    // Ignore temp file clean-up errors
                }
            }
        }
    }

    /** @returns {AppProfileModVerificationResult} */
    verifyProfileModsExist(/** @type {boolean} */ root, /** @type {AppProfile} */ profile) {
        const modsDir = this.getProfileModsDir(profile.name);
        const modList = root ? profile.rootMods : profile.mods;
        let hasError = false;

        const results = Array.from(modList.entries()).reduce((result, [modName, _mod]) => {
            const modExists = fs.existsSync(path.join(modsDir, modName));
            const modHasError = !modExists;

            hasError ||= modHasError;

            result = Object.assign(result, {
                [modName]: {
                    error: modHasError,
                    found: modExists
                }
            });

            return result;
        }, {});

        return {
            error: hasError,
            found: true,
            results
        };
    }

    /** @returns {AppProfileVerificationResult} */
    verifyProfilePathExists(/** @type {string} */ pathToVerify) {
        const pathExists = fs.existsSync(this.#expandPath(pathToVerify));
        return {
            error: !pathExists,
            found: pathExists
        };
    }

    /** 
     * @description Determines whether or not **any** profile is deployed in the `modBaseDir` of `profile`.
     * @returns {boolean}
     * */
    isSimilarProfileDeployed(/** @type {AppProfile} */ profile) {
        const metaFilePath = this.#expandPath(path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE));
        return fs.existsSync(metaFilePath);
    }

    /** 
     * @description Determines whether or the specific profile is deployed in the `modBaseDir` of `profile`.
     * @returns {boolean}
     * */
    isProfileDeployed(/** @type {AppProfile} */ profile) {
        return this.isSimilarProfileDeployed(profile) && this.readProfileDeploymentMetadata(profile)?.profile === profile.name;
    }

    /** @returns {ModDeploymentMetadata | undefined} */
    readProfileDeploymentMetadata(/** @type {AppProfile} */ profile) {
        const metaFilePath = this.#expandPath(path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE));
        const metaFileExists = fs.existsSync(metaFilePath);

        if (!metaFileExists) {
            return undefined;
        }

        return JSON.parse(fs.readFileSync(metaFilePath).toString("utf-8"));
    }

    /** @returns {void} */
    writeProfileDeploymentMetadata(/** @type {AppProfile} */ profile, /** @type {ModDeploymentMetadata} */ deploymentMetadata) {
        const metaFilePath = this.#expandPath(path.join(profile.modBaseDir, ElectronLoader.PROFILE_METADATA_FILE));

        return fs.writeFileSync(metaFilePath, JSON.stringify(deploymentMetadata));
    }

    /** @returns {Promise<AppProfileExternalFiles>} */
    async findProfileExternalFiles(/** @type {AppProfile} */ profile) {
        return {
            modDirFiles: await this.findProfileExternalFilesInDir(profile, profile.modBaseDir, true),
            gameDirFiles: await this.findProfileExternalFilesInDir(profile, profile.gameBaseDir, false),
            pluginFiles: await this.findProfileExternalPluginFiles(profile)
        };
    }

    /** @returns {Promise<Array<string>>} */
    async findProfileExternalFilesInDir(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ dirPath,
        /** @type {boolean} */ recursiveSearch
    ) {
        dirPath = path.resolve(this.#expandPath(dirPath));
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        let modDirFiles = await fs.readdir(dirPath, { encoding: "utf-8", recursive: recursiveSearch });

        // Filter out directories and deployment metadata
        modDirFiles = modDirFiles.filter((file) => {
            return !fs.lstatSync(path.join(dirPath, file)).isDirectory()
                && !file.startsWith(ElectronLoader.DEPLOY_EXT_BACKUP_DIR)
                && file !== ElectronLoader.PROFILE_METADATA_FILE;
        });

        if (this.isSimilarProfileDeployed(profile)) {
            const profileModFiles = this.readProfileDeploymentMetadata(profile)?.profileModFiles.map((filePath) => {
                // Resolve absolute file paths relative to `dirPath`
                if (path.isAbsolute(filePath)) {
                    filePath = filePath.replace(`${dirPath}${path.sep}`, "");
                }

                return filePath.toLowerCase();
            });

            if (!profileModFiles) {
                throw new Error("Unable to read deployment metadata.");
            }
            
            // Filter deployed files
            modDirFiles = modDirFiles.filter(file => !profileModFiles.includes(file.toLowerCase()));
        }

        return modDirFiles;
    }

    /** @returns {Promise<Array<string>>} */
    async findProfileExternalPluginFiles(/** @type {AppProfile} */ profile) {
        const gameDetails = this.#getGameDetails(profile.gameId);
        const modBaseDir = this.#expandPath(profile.modBaseDir);
        let externalFiles = await this.findProfileExternalFilesInDir(profile, modBaseDir, false);

        externalFiles = externalFiles.filter((modFile) => {
            // Make sure this is a mod file
            return gameDetails?.pluginFormats.includes(_.last(modFile.split("."))?.toLowerCase() ?? "");
        });

        externalFiles = _.sortBy(externalFiles, (externalPlugin) => {
            // Retrieve external plugin order using plugin file's "last modified" timestamp
            return fs.statSync(path.join(modBaseDir, externalPlugin)).mtime;
        });

        return externalFiles;
    }

    /** @returns {string[]} */
    readModFilePaths(
        /** @type {AppProfile} */ profile,
        /** @type {string} */ modName,
        /** @type {boolean | undefined} */ normalizePaths
    ) {
        const modDirPath = this.getProfileModDir(profile.name, modName);
        let files = fs.readdirSync(modDirPath, { encoding: "utf-8", recursive: true });

        if (normalizePaths) {
            files = files.map(file => this.#expandPath(file));
        }

        return files;
    }

    /** @returns {string | undefined} */
    getGameConfigFilePath(/** @type {AppProfile} */ profile, /** @type {string} */ configFileName) {
        if (profile.manageConfigFiles) {
            const profileConfigFilePath = path.join(this.getProfileConfigDir(profile.name), configFileName);

            if (fs.existsSync(profileConfigFilePath)) {
                return profileConfigFilePath;
            }
        }

        if (!!profile.configFilePath) {
            return path.join(profile.configFilePath, configFileName);
        }

        const gameDetails = this.#getGameDetails(profile.gameId);
        const configFilePaths = gameDetails?.gameConfigFiles?.[configFileName] ?? [];
        for (let configFilePath of configFilePaths) {
            configFilePath = this.#expandPath(configFilePath);
            if (fs.existsSync(configFilePath)) {
                return configFilePath;
            }
        }

        return undefined;
    }

    /** @returns {Promise<boolean>} */
    async checkArchiveInvalidationEnabled(/** @type {AppProfile} */ profile) {
        const gameDetails = this.#getGameDetails(profile.gameId);
        if (!gameDetails) {
            return false;
        }

        const archiveInvalidationConfig = Object.entries(gameDetails.archiveInvalidation ?? {});

        for (const [configFileName, configData] of archiveInvalidationConfig) {
            const configFilePath = this.getGameConfigFilePath(profile, configFileName);

            if (!configFilePath || !fs.existsSync(configFilePath)) {
                continue;
            }

            const configFileData = fs.readFileSync(configFilePath, { encoding: "utf-8" }).replace(/\r/g, "");
            if (configFileData.includes(configData.replace(/\r/g, ""))) {
                return true;
            }
        }

        return false;
    }

    /** @returns {Promise<void>} */
    async setArchiveInvalidationEnabled(/** @type {AppProfile} */ profile, /** @type {boolean} */ enabled) {
        if (await this.checkArchiveInvalidationEnabled(profile) === enabled) {
            return;
        }

        const gameDetails = this.#getGameDetails(profile.gameId);
        if (!gameDetails) {
            throw new Error("Game does not support archive invalidation.");
        }

        const archiveInvalidationConfig = Object.entries(gameDetails.archiveInvalidation ?? {});

        for (const [configFileName, configData] of archiveInvalidationConfig) {
            const configFilePath = this.getGameConfigFilePath(profile, configFileName);

            if (!configFilePath || !fs.existsSync(configFilePath)) {
                continue;
            }

            let configFileData = fs.readFileSync(configFilePath, { encoding: "utf-8" });

            if (!configFileData.includes(configData) && enabled) {
                configFileData = configData + configFileData;
            } else if (configFileData.includes(configData) && !enabled) {
                configFileData = configFileData.replace(configData, "");
            }

            fs.writeFileSync(configFilePath, configFileData, { encoding: "utf-8" });
        }
    }

    /** @returns {Promise<string[]>} */
    async deployGameResources(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ normalizePathCasing
    ) {
        const profileModFiles = [];
        const gameDetails = this.#getGameDetails(profile.gameId);

        if (gameDetails?.resources?.mods) {
            Object.entries(gameDetails.resources.mods).forEach(([resourceSrc, resourceDest]) => {
                const srcFilePath = path.join(ElectronLoader.GAME_RESOURCES_DIR, resourceSrc);

                if (normalizePathCasing) {
                    // TODO - Apply normalization rules to `resourceDest`
                }

                const destFilePath = this.#expandPath(path.join(profile.modBaseDir, resourceDest));

                if (fs.existsSync(destFilePath)) {
                    return;
                }

                if (profile.linkMode) {
                    fs.mkdirpSync(path.dirname(destFilePath));
                    fs.linkSync(srcFilePath, destFilePath);
                } else {
                    fs.copySync(srcFilePath, destFilePath, { overwrite: false });
                }

                profileModFiles.push(resourceDest);
            });
        } 

        return profileModFiles;
    }
    
    /** @returns {GamePluginProfileRef[]} */
    findPluginFiles(
        /** @type {AppProfile} */ profile
    ) {
        const gameDb = this.loadGameDatabase();
        const gameDetails = gameDb[profile.gameId];
        const gamePluginFormats = gameDetails?.pluginFormats ?? [];

        return Array.from(profile.mods.entries()).reduce((/** @type {GamePluginProfileRef[]} */ plugins, [modId, modRef]) => {
            const modDirPath = this.getProfileModDir(profile.name, modId);
            
            if (fs.existsSync(modDirPath)) {
                const modFiles = fs.readdirSync(modDirPath, { encoding: "utf-8", recursive: false });
                const modPlugins = modFiles
                    .filter((modFile) => gamePluginFormats.some((gamePluginFormat) => {
                        return modFile.toLowerCase().endsWith(`.${gamePluginFormat}`);
                    }))
                    .filter((modFile) => fs.lstatSync(path.join(modDirPath, modFile)).isFile())
                    .map((modFile) => ({
                        modId,
                        plugin: modFile,
                        enabled: modRef.enabled
                    }));

                plugins.push(...modPlugins);
            }

            return plugins;
        }, []);
    }

    /** @returns {Promise<string[]>} */
    async deployMods(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ root,
        /** @type {boolean} */ normalizePathCasing
    ) {
        const profileModFiles = [];
        const relModDir = this.#expandPath(root ? profile.gameBaseDir : profile.modBaseDir);
        const modBaseDir = path.resolve(relModDir);
        const extFilesBackupDir = path.join(relModDir, ElectronLoader.DEPLOY_EXT_BACKUP_DIR);
        const extFilesList = await this.findProfileExternalFilesInDir(profile, relModDir, !root);
        const gameDb = this.loadGameDatabase();
        const gameDetails = gameDb[profile.gameId];
        const gamePluginFormats = gameDetails?.pluginFormats ?? [];

        const existingDataSubdirs = (await fs.readdir(modBaseDir)).filter((existingModFile) => {
            return fs.lstatSync(path.join(modBaseDir, existingModFile)).isDirectory();
        });

        // Copy all mods to the modBaseDir for this profile
        // (Copy mods in reverse with `overwrite: false` to follow load order and allow existing manual mods in the folder to be preserved)
        const deployableMods = root ? profile.rootMods : profile.mods;
        const deployableModFiles = Array.from(deployableMods.entries()).reverse();
        for (const [modName, mod] of deployableModFiles) {
            if (mod.enabled) {
                const copyTasks = [];
                const modDirPath = this.getProfileModDir(profile.name, modName);
                const modFilesToCopy = await fs.readdir(modDirPath, { encoding: "utf-8", recursive: true });

                // Copy data files to mod base dir
                for (let modFile of modFilesToCopy) {
                    const srcFilePath = path.resolve(path.join(modDirPath, modFile.toString()));

                    // If file path normalization is enabled, apply to all files inside Data subdirectories (i.e. textures/, meshes/)
                    if (normalizePathCasing && modFile.includes(path.sep)) {
                        // Convert file paths to lowercase
                        // If this file is a plugin, preserve the plugin name's casing
                        if (gamePluginFormats.some(pluginFormat => modFile.endsWith(pluginFormat))) {
                            modFile = path.join(path.dirname(modFile).toLowerCase(), path.basename(modFile));
                        } else {
                            modFile = modFile.toLowerCase();
                        }

                        if (root) {
                            // Preserve capitalization of Data directory for root mods
                            modFile = modFile.replace(/^data[\\/]/, `Data${path.sep}`);
                        } else {
                            // Apply capitalization rules of any existing Data subdirectories to ensure only one folder is created
                            // TODO - Also do this for root mods
                            // TODO - Do this recursively
                            existingDataSubdirs.forEach((existingDataSubdir) => {
                                existingDataSubdir = `${existingDataSubdir}${path.sep}`;
                                const lowerSubdir = existingDataSubdir.toLowerCase();
                                if (modFile.startsWith(lowerSubdir)) {
                                    modFile = modFile.replace(lowerSubdir, existingDataSubdir);
                                }
                            });
                        }
                    }

                    const destFilePath = path.join(modBaseDir, modFile);
                    // Don't copy directories directly
                    let shouldCopy = !fs.lstatSync(srcFilePath).isDirectory();

                    if (fs.existsSync(destFilePath)) {
                        if (extFilesList?.includes(modFile)) {
                            // Backup original external file to temp directory for deploy and override
                            fs.moveSync(destFilePath, path.join(extFilesBackupDir, modFile));
                        } else {
                            // Don't override deployed files
                            shouldCopy = false;
                        }
                    }
                    
                    if (shouldCopy && modFile.length > 0) {
                        // Record mod files written from profile
                        // Record full path for root mods
                        profileModFiles.push(root ? destFilePath : modFile);
                    }

                    if (shouldCopy) {
                        if (profile.linkMode) {
                            await fs.mkdirp(path.dirname(destFilePath));
                            copyTasks.push(fs.link(srcFilePath, destFilePath));
                        } else {
                            copyTasks.push(fs.copy(srcFilePath, destFilePath, { overwrite: false }));
                        }
                    }
                }

                await Promise.all(copyTasks);
            }
        }

        return profileModFiles;
    }

    /** @returns {Promise<string>} */
    async writePluginList(/** @type {AppProfile} */ profile) {
        const pluginListPath = profile.pluginListPath ? path.resolve(this.#expandPath(profile.pluginListPath)) : "";

        if (pluginListPath) {
            fs.mkdirpSync(path.dirname(pluginListPath));
            
            // Backup any existing plugins file
            if (fs.existsSync(pluginListPath)) {
                let backupFile = `${pluginListPath}.sml_bak`;
                while (fs.existsSync(backupFile)) {
                    backupFile += `_${this.#currentDateTimeAsFileName()}`;
                }

                fs.copyFileSync(pluginListPath, backupFile);
            }

            // Write the plugin list
            try {
                fs.writeFileSync(pluginListPath, this.#createProfilePluginList(profile));
            } catch (err) {
                throw new Error(`Unable to write plugins list: ${err.toString()}`);
            }

            return pluginListPath;
        } else {
            throw new Error(`Unable to write plugins list: Plugin list path not defined in profile "${profile.name}"`);
        }
    }

    /** @returns {Promise<string[]>} */
    async writeConfigFiles(/** @type {AppProfile} */ profile) {
        const deployConfigDir = profile.configFilePath ? this.#expandPath(profile.configFilePath) : undefined;

        if (!deployConfigDir || !fs.existsSync(deployConfigDir)) {
            throw new Error(`Unable to write config files: Profile's Config File Path "${profile.configFilePath}" is not valid.`);
        }
        
        const backupDir = path.join(deployConfigDir, ElectronLoader.DEPLOY_EXT_BACKUP_DIR);
        const profileConfigDir = this.getProfileConfigDir(profile.name);

        if (!fs.existsSync(profileConfigDir)) {
            return [];
        }

        const profileConfigFiles = fs.readdirSync(profileConfigDir);
        
        const writtenConfigFiles = [];
        for (const configFileName of profileConfigFiles) {
            const configSrcPath = path.join(profileConfigDir, configFileName);
            const configDestPath = path.join(deployConfigDir, configFileName);

            if (!fs.existsSync(configSrcPath)) {
                break;
            }

            // Backup any existing config files
            if (fs.existsSync(configDestPath)) {
                let backupFile = path.join(backupDir, configFileName);
                while (fs.existsSync(backupFile)) {
                    backupFile += `_${this.#currentDateTimeAsFileName()}`;
                }

                fs.moveSync(configDestPath, backupFile);
            }

            await fs.copyFile(configSrcPath, configDestPath);
            writtenConfigFiles.push(configDestPath);
        }

        return writtenConfigFiles;
    }

    /** @returns {Promise<string[]>} */
    async processDeployedFiles(/** @type {AppProfile} */ profile, /** @type {string[]} */ profileModFiles) {
        const gameDetails = this.#getGameDetails(profile.gameId);

        // Gamebryo games require processing of plugin file timestamps to enforce load order
        if (!!gameDetails && profile.plugins && gameDetails.pluginListType === "Gamebryo") {
            const modBaseDir = path.resolve(this.#expandPath(profile.modBaseDir));
            let pluginTimestamp = Date.now() / 1000 | 0;
            profile.plugins.forEach((pluginRef) => {
                // Set plugin order using the plugin file's "last modified" timestamp
                fs.utimesSync(path.join(modBaseDir, pluginRef.plugin), pluginTimestamp, pluginTimestamp);
                ++pluginTimestamp;
            });
        }

        return [];
    }

    /** @returns {Promise<void>} */
    async deployProfile(
        /** @type {AppProfile} */ profile,
        /** @type {boolean} */ deployPlugins,
        /** @type {boolean} */ normalizePathCasing
    ) {
        /** @type {string[]} */
        const profileModFiles = [];
        let deploymentError = undefined;

        try {
            // Ensure the mod base dir exists
            fs.mkdirpSync(this.#expandPath(profile.modBaseDir));

            if (this.isSimilarProfileDeployed(profile)) {
                await this.undeployProfile(profile);
            }

            log.info("Deploying profile", profile.name);

            // Deploy mods
            profileModFiles.push(... await this.deployMods(profile, true, normalizePathCasing));
            profileModFiles.push(... await this.deployMods(profile, false, normalizePathCasing));

            if (deployPlugins && profile.plugins.length > 0) {
                // Write plugin list
                profileModFiles.push(await this.writePluginList(profile));
            }

            if (profile.manageConfigFiles) {
                profileModFiles.push(... await this.writeConfigFiles(profile));
            }

            // Write game resources
            profileModFiles.push(... await this.deployGameResources(profile, normalizePathCasing));

            // Process deployed files
            profileModFiles.push(... await this.processDeployedFiles(profile, profileModFiles));
        } catch (err) {
            deploymentError = err;
        }

        // Write the deployment metadata file
        if (profileModFiles.length > 0) {
            this.writeProfileDeploymentMetadata(profile, {
                profile: profile.name,
                profileModFiles
            });
        }

        if (deploymentError) {
            // Remove any partially deployed files if deployment failed
            try {
                this.undeployProfile(profile);
            } catch (_err) {}

            log.error("Mod deployment failed: ", deploymentError);
            throw deploymentError;
        }

        log.info("Mod deployment succeeded");
    }

    /** @returns {Promise<void>} */
    async undeployProfile(/** @type {AppProfile} */ profile) {
        try {
            if (!this.isSimilarProfileDeployed(profile)) {
                return;
            }

            const deploymentMetadata = this.readProfileDeploymentMetadata(profile);
            if (!deploymentMetadata) {
                log.error("Mod undeployment failed unexpectedly.");
                return;
            }

            log.info("Undeploying profile", deploymentMetadata.profile);

            const modBaseDir = this.#expandPath(profile.modBaseDir);
            const gameBaseDir = this.#expandPath(profile.gameBaseDir);
            const configFilePath = profile.configFilePath ? this.#expandPath(profile.configFilePath) : undefined;

            // Only remove files managed by this profile
            const undeployJobs = deploymentMetadata.profileModFiles.map(async (existingFile) => {
                const fullExistingPath = path.isAbsolute(existingFile)
                    ? existingFile
                    : path.join(modBaseDir, existingFile);

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

            const extFilesBackupDirs = _.uniq([
                path.join(modBaseDir, ElectronLoader.DEPLOY_EXT_BACKUP_DIR),
                path.join(gameBaseDir, ElectronLoader.DEPLOY_EXT_BACKUP_DIR),
                ... configFilePath ? [path.join(configFilePath, ElectronLoader.DEPLOY_EXT_BACKUP_DIR)] : []
            ]);
            
            // Restore original external files, if any were moved
            for (const extFilesBackupDir of extFilesBackupDirs) {
                if (fs.existsSync(extFilesBackupDir)) {
                    const backupTransfers = fs.readdirSync(extFilesBackupDir).map((backupFile) => {
                        const backupSrc = path.join(extFilesBackupDir, backupFile);
                        const backupDest = path.join(path.dirname(extFilesBackupDir), backupFile);

                        // Use hardlinks for faster file restoration in link mode
                        if (profile.linkMode && !fs.lstatSync(backupSrc).isDirectory()) {
                            // TODO - Recursively do this when encountering directories
                            return fs.link(backupSrc, backupDest);
                        } else {
                            return fs.copy(backupSrc, backupDest);
                        }
                    });

                    await Promise.all(backupTransfers);
                }
            }

            // If all undeploy operations succeeded, remove deployment metadata file
            const metadataFilePath = path.join(modBaseDir, ElectronLoader.PROFILE_METADATA_FILE);
            if (fs.existsSync(metadataFilePath)) {
                fs.rmSync(path.join(modBaseDir, ElectronLoader.PROFILE_METADATA_FILE));
            }

            // Remove file backup directories
            for (const extFilesBackupDir of extFilesBackupDirs) {
                if (fs.existsSync(extFilesBackupDir)) {
                    fs.removeSync(extFilesBackupDir);
                }
            }
        } catch (err) {
            log.error("Mod undeployment failed: ", err);
            throw err;
        }

        log.info("Mod undeployment succeeded");
    }

    showAppAboutInfo() {
        let depsLicenseText = "";
        let depsInfo = "";

        try {
            depsLicenseText = fs.readFileSync(ElectronLoader.APP_DEPS_LICENSES_FILE).toString("utf-8");
        } catch (_err) {}

        try {
            depsInfo = JSON.parse(fs.readFileSync(ElectronLoader.APP_DEPS_INFO_FILE).toString("utf-8"));
        } catch (_err) {}

        this.mainWindow.webContents.send("app:showAboutInfo", {
            depsLicenseText,
            depsInfo
        });
    }

    /** @returns {Promise<string>} */
    async openGameConfigFile(/** @type {string[]} */ cfgPaths) {
        for (const cfgPath of cfgPaths) {
            try {
                const preparedPath = path.resolve(this.#expandPath(cfgPath));

                if (fs.existsSync(preparedPath)) {
                    const result = await shell.openPath(preparedPath);

                    if (!result) {
                        return result;
                    }
                }
            } catch (_e) {}
        }

        throw new Error("Unable to open config file.");
    }

    /** @returns {GameDetails | undefined} */
    #getGameDetails(/** @type {GameId} */ gameId) {
        const gameDb = this.loadGameDatabase();
        return gameDb[gameId];
    }

    /** @returns {string} */
    #createProfilePluginList(
        /** @type {AppProfile} */ profile,
        /** @type {GamePluginListType | undefined} */ listType
    ) {
        const gameDetails = this.#getGameDetails(profile.gameId);

        switch (listType ?? gameDetails?.pluginListType) {
            case "Gamebryo": {
                return this.#createProfilePluginListGamebryo(profile);
            }
            case "CreationEngine":
            case "Default": {
                return this.#createProfilePluginListCreationEngine(profile);
            }
            default: throw new Error("Game has unknown plugin list type.");
        }
    }

    /** @returns {string} */
    #createProfilePluginListHeader(/** @type {AppProfile} */ profile) {
        return `# This file was generated automatically by Starfield Mod Loader for profile "${profile.name}"\n`;
    }

    /** @returns {string} */
    #createProfilePluginListGamebryo(/** @type {AppProfile} */ profile) {
        const header = this.#createProfilePluginListHeader(profile);

        return profile.plugins.reduce((data, pluginRef) => {
            if (pluginRef.enabled) {
                data += pluginRef.plugin;
                data += "\n";
            }
            return data;
        }, header);
    }

    /** @returns {string} */
    #createProfilePluginListCreationEngine(/** @type {AppProfile} */ profile) {
        const header = this.#createProfilePluginListHeader(profile);

        return profile.plugins.reduce((data, pluginRef) => {
            if (pluginRef.enabled) {
                data += "*";
            }

            data += pluginRef.plugin;
            data += "\n";
            return data;
        }, header);
    }

    /** @returns {string} */
    #expandPath(/** @type {string} */ _path) {

        // Normalize separators for the current platform
        _path = _path.replace(/[\\/]/g, path.sep);

        // Expand home dir
        if (_path[0] === "~") {
            _path = _path.replace(/~/, os.homedir());
        }

        // Expand Windows env vars
        return this.#resolveWindowsEnvironmentVariables(_path);
    }

    /** @returns {string | undefined} */
    #firstValidPath(
        /** @type {string[]} */ paths,
        /** @type {((path: string) => string) | undefined} */ pathCheckTransformer
    ) {
        return paths
                .map(_path => this.#expandPath(_path))
                .find(_path => fs.existsSync(pathCheckTransformer ? pathCheckTransformer(_path) : _path));
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

    /** @returns {string} */
    #asFileName(/** @type {string} */ text) {
        return text.replace(/[*?"<>|:./\\]/g, "_");
    }

    /** @returns {string} */
    #currentDateTimeAsFileName() {
        return this.#asFileName(new Date().toISOString());
    }
}

// Load the app
const loader = new ElectronLoader();