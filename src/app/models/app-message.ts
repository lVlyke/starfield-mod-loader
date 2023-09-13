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

    export type AppMessage = LoadSettings
                           | SaveSettings
                           | LoadProfile
                           | SaveProfile
                           | VerifyProfile;

    // Profile messages:

    export namespace ProfileMessage {
       
        export type Prefix = typeof PREFIX;

        export const PREFIX = "profile";
    }

    export interface AddProfileMod extends Base {
        id: `${ProfileMessage.Prefix}:addMod`;
        data: {
            profile: AppProfile;
        };
    }

    export type ProfileMessage = AddProfileMod;

    // Message record:

    export const record: Array<_AppMessage["id"]> = [
        "app:loadSettings",
        "app:saveSettings",
        "app:loadProfile",
        "app:saveProfile",
        "app:verifyProfile",

        "profile:addMod"
    ];
}