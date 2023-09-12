import { AppProfile } from "./app-profile";
import { AppSettingsUserCfg } from "./app-settings-user-cfg";

export type AppMessage
    = AppMessage.AppMessage;

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

    export type AppMessage = LoadSettings
                           | SaveSettings
                           | LoadProfile
                           | SaveProfile;

    export const record: Array<AppMessage["id"]> = [
        "app:loadSettings",
        "app:saveSettings",
        "app:loadProfile",
        "app:saveProfile",
    ];
}