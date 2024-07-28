import { AppData } from "./app-data";
import { AppDependenciesInfo } from "./app-dependency-info";
import { AppProfile } from "./app-profile";
import { AppSettingsUserCfg } from "./app-settings-user-cfg";
import { GameId } from "./game-id";
import { ModImportRequest } from "./mod-import-status";

export type AppMessage
    = AppMessage.AppMessage
    | AppMessage.ProfileMessage;

export type AppMessageData<I extends AppMessage["id"]> = (AppMessage & { id: I })["data"];

type _AppMessage = AppMessage;

export namespace AppMessage {

    export type Prefix = typeof PREFIX;

    export const PREFIX = "app";

    export interface Base {
        id: string;
        data?: unknown;
    }

    // App messages:

    export interface SyncUiState extends Base {
        id: `${Prefix}:syncUiState`;
        data: {
            appState: AppData;
            modListCols: string[];
            defaultModListCols: string[];
        }
    }

    export interface ChooseDirectory extends Base {
        id: `${Prefix}:chooseDirectory`;
        data: {
            baseDir?: string;
        }
    }

    export interface ChooseFilePath extends Base {
        id: `${Prefix}:chooseFilePath`;
        data: {
            baseDir?: string;
            fileTypes?: string[];
        }
    }

    export interface VerifyPathExists extends Base {
        id: `${Prefix}:verifyPathExists`;
        data: {
            path: string | string[];
            dirname?: boolean;
        }
    }

    export interface OpenFile extends Base {
        id: `${Prefix}:openFile`;
        data: {
            path: string;
        }
    }

    export interface LoadProfileList extends Base {
        id: `${Prefix}:loadProfileList`;
    }

    export interface LoadSettings extends Base {
        id: `${Prefix}:loadSettings`;
    }

    export interface SaveSettings extends Base {
        id: `${Prefix}:saveSettings`;
        data: {
            settings: AppSettingsUserCfg;
        };
    }

    export interface NewProfile extends Base {
        id: `${Prefix}:newProfile`;
    }

    export interface DeleteProfile extends Base {
        id: `${Prefix}:deleteProfile`;
        data: {
            profile: AppProfile;
        };
    }

    export interface LoadProfile extends Base {
        id: `${Prefix}:loadProfile`;
        data: {
            name: string;
            gameId: string;
        };
    }

    export interface LoadExternalProfile extends Base {
        id: `${Prefix}:loadExternalProfile`;
        data: {
            profilePath?: string;
        };
    }

    export interface SaveProfile extends Base {
        id: `${Prefix}:saveProfile`;
        data: {
            name: string;
            profile: AppProfile;
        };
    }

    export interface VerifyProfile extends Base {
        id: `${Prefix}:verifyProfile`;
        data: {
            profile: AppProfile;
        };
    }

    export interface CopyProfileData extends Base {
        id: `${Prefix}:copyProfileData`;
        data: {
            srcProfile: AppProfile;
            destProfile: AppProfile;
        };
    }

    export interface ShowPreferences extends Base {
        id: `${Prefix}:showPreferences`;
    }

    export interface LoadGameDatabase extends Base {
        id: `${Prefix}:loadGameDatabase`;
    }

    export interface FindBestProfileDefaults extends Base {
        id: `${Prefix}:findBestProfileDefaults`;
        data: {
            gameId: GameId;
        };
    }

    export interface ShowAboutInfo extends Base {
        id: `${Prefix}:showAboutInfo`;
        data: {
            depsInfo: AppDependenciesInfo;
            depsLicenseText: string;
        };
    }

    export interface ToggleModListColumn extends Base {
        id: `${Prefix}:toggleModListColumn`;
        data: {
            column?: string;
            reset?: boolean;
        };
    }

    export type AppMessage = SyncUiState
                           | ChooseDirectory
                           | ChooseFilePath
                           | VerifyPathExists
                           | OpenFile
                           | LoadProfileList
                           | LoadSettings
                           | SaveSettings
                           | NewProfile
                           | DeleteProfile
                           | LoadProfile
                           | LoadExternalProfile
                           | SaveProfile
                           | VerifyProfile
                           | CopyProfileData
                           | ShowPreferences
                           | LoadGameDatabase
                           | FindBestProfileDefaults
                           | ShowAboutInfo
                           | ToggleModListColumn;

    // Profile messages:

    export namespace ProfileMessage {
       
        export type Prefix = typeof PREFIX;

        export const PREFIX = "profile";
    }

    export interface ProfileSettings extends Base {
        id: `${ProfileMessage.Prefix}:settings`;
        data: {
            profile: AppProfile;
        };
    }

    export interface BeginModAdd extends Base {
        id: `${ProfileMessage.Prefix}:beginModAdd`;
        data: {
            profile: AppProfile;
            modPath?: string;
            root?: boolean;
        };
    }

    export interface BeginModExternalImport extends Base {
        id: `${ProfileMessage.Prefix}:beginModExternalImport`;
        data: {
            profile: AppProfile;
            modPath?: string;
            root?: boolean;
        };
    }

    export interface CompleteModImport extends Base {
        id: `${ProfileMessage.Prefix}:completeModImport`;
        data: {
            importRequest: ModImportRequest;
        };
    }

    export interface DeleteProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:deleteMod`;
        data: {
            profile: AppProfile;
            modName: string;
        };
    }

    export interface RenameProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:renameMod`;
        data: {
            profile: AppProfile;
            modCurName: string;
            modNewName: string;
        };
    }

    export interface ReadProfileModFilePaths extends Base {
        id: `${ProfileMessage.Prefix}:readModFilePaths`;
        data: {
            profile: AppProfile;
            modName: string;
            normalizePaths?: boolean;
        };
    }

    export interface FindPluginFiles extends Base {
        id: `${ProfileMessage.Prefix}:findPluginFiles`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ImportProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:importPluginBackup`;
        data: {
            profile: AppProfile;
            backupPath: string;
        };
    }

    export interface CreateProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:createPluginBackup`;
        data: {
            profile: AppProfile;
            backupName: string;
        };
    }

    export interface DeleteProfilePluginBackup extends Base {
        id: `${ProfileMessage.Prefix}:deletePluginBackup`;
        data: {
            profile: AppProfile;
            backupFile: string;
        };
    }

    export interface ReadProfilePluginBackups extends Base {
        id: `${ProfileMessage.Prefix}:readPluginBackups`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ExportProfilePluginList extends Base {
        id: `${ProfileMessage.Prefix}:exportPluginList`;
        data: {
            profile: AppProfile;
        };
    }

    export interface CheckArchiveInvalidationEnabled extends Base {
        id: `${ProfileMessage.Prefix}:checkArchiveInvalidationEnabled`;
        data: {
            profile: AppProfile;
        };
    }

    export interface SetArchiveInvalidationEnabled extends Base {
        id: `${ProfileMessage.Prefix}:setArchiveInvalidationEnabled`;
        data: {
            profile: AppProfile;
            enabled: boolean;
        };
    }

    export interface DeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:deploy`;
        data: {
            profile: AppProfile;
            deployPlugins: boolean;
            normalizePathCasing: boolean;
        };
    }

    export interface UndeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:undeploy`;
        data: {
            profile: AppProfile;
        };
    }

    export interface FindDeployedProfile extends Base {
        id: `${ProfileMessage.Prefix}:findDeployedProfile`;
        data: {
            refProfile: AppProfile;
        };
    }

    export interface FindProfileExternalFiles extends Base {
        id: `${ProfileMessage.Prefix}:findExternalFiles`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowModInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showModInFileExplorer`;
        data: {
            profile: AppProfile;
            modName: string;
        };
    }

    export interface ShowModBaseDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showModBaseDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileBaseDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileBaseDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileModsDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileModsDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfileConfigDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfileConfigDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowGameBaseDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showGameBaseDirInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface ShowProfilePluginBackupsInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showProfilePluginBackupsInFileExplorer`;
        data: {
            profile: AppProfile;
        };
    }

    export interface LaunchGame extends Base {
        id: `${ProfileMessage.Prefix}:launchGame`;
        data: {
            profile: AppProfile;
        };
    }

    export interface OpenGameConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:openGameConfigFile`;
        data: {
            configPaths: string[];
        };
    }

    export interface OpenProfileConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:openProfileConfigFile`;
        data: {
            profile: AppProfile;
            configFileName: string;
        };
    }

    export interface ReadConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:readConfigFile`;
        data: {
            profile: AppProfile;
            fileName: string;
            loadDefaults: boolean;
        };
    }

    export interface UpdateConfigFile extends Base {
        id: `${ProfileMessage.Prefix}:updateConfigFile`;
        data: {
            profile: AppProfile;
            fileName: string;
            data: string;
        };
    }

    export type ProfileMessage = ProfileSettings
                               | BeginModAdd
                               | BeginModExternalImport
                               | CompleteModImport
                               | DeleteProfileMod
                               | RenameProfileMod
                               | ReadProfileModFilePaths
                               | FindPluginFiles
                               | ImportProfilePluginBackup
                               | CreateProfilePluginBackup
                               | DeleteProfilePluginBackup
                               | ReadProfilePluginBackups
                               | ExportProfilePluginList
                               | CheckArchiveInvalidationEnabled
                               | SetArchiveInvalidationEnabled
                               | DeployProfile
                               | UndeployProfile
                               | FindDeployedProfile
                               | FindProfileExternalFiles
                               | ShowModInFileExplorer
                               | ShowModBaseDirInFileExplorer
                               | ShowProfileBaseDirInFileExplorer
                               | ShowGameBaseDirInFileExplorer
                               | ShowProfileModsDirInFileExplorer
                               | ShowProfileConfigDirInFileExplorer
                               | ShowProfilePluginBackupsInFileExplorer
                               | LaunchGame
                               | OpenGameConfigFile
                               | OpenProfileConfigFile
                               | ReadConfigFile
                               | UpdateConfigFile;

    // Message record:

    export const record: Array<_AppMessage["id"]> = [
        "app:syncUiState",
        "app:chooseDirectory",
        "app:chooseFilePath",
        "app:verifyPathExists",
        "app:openFile",
        "app:loadProfileList",
        "app:loadSettings",
        "app:saveSettings",
        "app:newProfile",
        "app:deleteProfile",
        "app:loadProfile",
        "app:loadExternalProfile",
        "app:saveProfile",
        "app:copyProfileData",
        "app:verifyProfile",
        "app:showPreferences",
        "app:loadGameDatabase",
        "app:findBestProfileDefaults",
        "app:showAboutInfo",
        "app:toggleModListColumn",

        "profile:settings",
        "profile:beginModAdd",
        "profile:beginModExternalImport",
        "profile:completeModImport",
        "profile:deleteMod",
        "profile:renameMod",
        "profile:readModFilePaths",
        "profile:findPluginFiles",
        "profile:importPluginBackup",
        "profile:createPluginBackup",
        "profile:deletePluginBackup",
        "profile:readPluginBackups",
        "profile:exportPluginList",
        "profile:checkArchiveInvalidationEnabled",
        "profile:setArchiveInvalidationEnabled",
        "profile:deploy",
        "profile:undeploy",
        "profile:findDeployedProfile",
        "profile:findExternalFiles",
        "profile:showModInFileExplorer",
        "profile:showModBaseDirInFileExplorer",
        "profile:showProfileBaseDirInFileExplorer",
        "profile:showProfileModsDirInFileExplorer",
        "profile:showProfileConfigDirInFileExplorer",
        "profile:showGameBaseDirInFileExplorer",
        "profile:showProfilePluginBackupsInFileExplorer",
        "profile:launchGame",
        "profile:openGameConfigFile",
        "profile:openProfileConfigFile",
        "profile:readConfigFile",
        "profile:updateConfigFile"
    ];
}