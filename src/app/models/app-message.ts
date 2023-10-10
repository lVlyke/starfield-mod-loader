import { AppData } from "./app-data";
import { AppDependenciesInfo } from "./app-dependency-info";
import { AppProfile } from "./app-profile";
import { AppSettingsUserCfg } from "./app-settings-user-cfg";
import { GameDetails } from "./game-details";
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

    export interface CopyProfileMods extends Base {
        id: `${Prefix}:copyProfileMods`;
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
            gameDetails: GameDetails;
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
                           | LoadSettings
                           | SaveSettings
                           | NewProfile
                           | DeleteProfile
                           | LoadProfile
                           | SaveProfile
                           | VerifyProfile
                           | CopyProfileMods
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
        };
    }

    export interface BeginModExternalImport extends Base {
        id: `${ProfileMessage.Prefix}:beginModExternalImport`;
        data: {
            profile: AppProfile;
            modPath?: string;
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

    export interface DeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:deploy`;
        data: {
            profile: AppProfile;
        };
    }

    export interface UndeployProfile extends Base {
        id: `${ProfileMessage.Prefix}:undeploy`;
        data: {
            profile: AppProfile;
        };
    }

    export interface FindManualProfileMods extends Base {
        id: `${ProfileMessage.Prefix}:findManualMods`;
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

    export interface ShowGameBaseDirInFileExplorer extends Base {
        id: `${ProfileMessage.Prefix}:showGameBaseDirInFileExplorer`;
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

    export type ProfileMessage = ProfileSettings
                               | BeginModAdd
                               | BeginModExternalImport
                               | CompleteModImport
                               | DeleteProfileMod
                               | RenameProfileMod
                               | DeployProfile
                               | UndeployProfile
                               | FindManualProfileMods
                               | ShowModInFileExplorer
                               | ShowModBaseDirInFileExplorer
                               | ShowProfileBaseDirInFileExplorer
                               | ShowGameBaseDirInFileExplorer
                               | ShowProfileModsDirInFileExplorer
                               | LaunchGame
                               | OpenGameConfigFile;

    // Message record:

    export const record: Array<_AppMessage["id"]> = [
        "app:syncUiState",
        "app:chooseDirectory",
        "app:chooseFilePath",
        "app:loadSettings",
        "app:saveSettings",
        "app:newProfile",
        "app:deleteProfile",
        "app:loadProfile",
        "app:saveProfile",
        "app:copyProfileMods",
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
        "profile:deploy",
        "profile:undeploy",
        "profile:findManualMods",
        "profile:showModInFileExplorer",
        "profile:showModBaseDirInFileExplorer",
        "profile:showProfileBaseDirInFileExplorer",
        "profile:showProfileModsDirInFileExplorer",
        "profile:showGameBaseDirInFileExplorer",
        "profile:launchGame",
        "profile:openGameConfigFile"
    ];
}