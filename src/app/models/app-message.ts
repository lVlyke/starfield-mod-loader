import { AppProfile } from "./app-profile";
import { AppSettingsUserCfg } from "./app-settings-user-cfg";

export type AppMessage
    = AppMessage.AppMessage
    | AppMessage.ProfileMessage;

type _AppMessage = AppMessage;

export namespace AppMessage {

    export type Prefix = typeof PREFIX;

    export const PREFIX = "app";

    export interface Base {
        id: string;
        data?: unknown;
    }

    // App messages:

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

    export type AppMessage = ChooseDirectory
                           | ChooseFilePath
                           | LoadSettings
                           | SaveSettings
                           | LoadProfile
                           | SaveProfile
                           | VerifyProfile;

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

    export interface AddProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:addMod`;
        data: {
            profile: AppProfile;
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

    export type ProfileMessage = ProfileSettings
                               | AddProfileMod
                               | DeleteProfileMod
                               | RenameProfileMod
                               | DeployProfile
                               | UndeployProfile
                               | ShowModInFileExplorer
                               | ShowModBaseDirInFileExplorer
                               | ShowProfileBaseDirInFileExplorer
                               | ShowGameBaseDirInFileExplorer
                               | ShowProfileModsDirInFileExplorer
                               | LaunchGame;

    // Message record:

    export const record: Array<_AppMessage["id"]> = [
        "app:chooseDirectory",
        "app:chooseFilePath",
        "app:loadSettings",
        "app:saveSettings",
        "app:loadProfile",
        "app:saveProfile",
        "app:verifyProfile",

        "profile:settings",
        "profile:addMod",
        "profile:deleteMod",
        "profile:renameMod",
        "profile:deploy",
        "profile:undeploy",
        "profile:showModInFileExplorer",
        "profile:showModBaseDirInFileExplorer",
        "profile:showProfileBaseDirInFileExplorer",
        "profile:showProfileModsDirInFileExplorer",
        "profile:showGameBaseDirInFileExplorer",
        "profile:launchGame",
    ];
}