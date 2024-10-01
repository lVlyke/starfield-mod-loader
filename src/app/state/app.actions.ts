import { BasicAction } from "./basic-action";
import { AppData } from "../models/app-data";
import { AppProfile } from "../models/app-profile";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";

export namespace AppActions {

    function createBasicAction(property: keyof AppData, action: string): BasicAction.Constructor<AppData, keyof AppData> {
        return BasicAction.create<AppData, keyof AppData>(
            "app",
            action,
            property
        );
    }

    function createUpdateAction(property: keyof AppData): BasicAction.Constructor<AppData, keyof AppData> {
        return createBasicAction(property, "update");
    }

    export type ActiveProfileAction = BasicAction<AppData, "activeProfile">;
    export type DeployInProgressAction = BasicAction<AppData, "deployInProgress">;
    export type PluginsEnabledAction = BasicAction<AppData, "pluginsEnabled">;
    export type NormalizePathCasingAction = BasicAction<AppData, "normalizePathCasing">;
    export type VerifyProfileOnStartAction = BasicAction<AppData, "verifyProfileOnStart">;
    export type GameDbAction = BasicAction<AppData, "gameDb">;
    export type ModListColumnsAction = BasicAction<AppData, "modListColumns">;

    export const updateActiveProfile = createUpdateAction("activeProfile");
    export const setDeployInProgress = createUpdateAction("deployInProgress");
    export const setPluginsEnabled = createUpdateAction("pluginsEnabled");
    export const setNormalizePathCasing = createUpdateAction("normalizePathCasing");
    export const setVerifyProfileOnStart = createUpdateAction("verifyProfileOnStart");
    export const updateGameDb = createUpdateAction("gameDb");
    export const updateModListColumns = createUpdateAction("modListColumns");

    export class UpdateSettings {
        public static readonly type = `[app] update settings`;

        constructor(
            public settings: Partial<AppData>
        ) {}
    }

    export class UpdateSettingsFromUserCfg {
        public static readonly type = `[app] update from user cfg`;

        constructor(
            public settings: Partial<AppSettingsUserCfg>
        ) {}
    }

    export class SetProfiles {
        public static readonly type = `[app] set profiles`;

        constructor(
            public profiles?: AppProfile.Description[]
        ) {}
    }

    export class AddProfile {
        public static readonly type = `[app] add profile`;

        constructor(
            public profile: AppProfile.Description
        ) {}
    }

    export class DeleteProfile {
        public static readonly type = `[app] delete profile`;

        constructor(
            public profile: AppProfile.Description
        ) {}
    }

    export class ToggleModListColumn {
        public static readonly type = `[app] toggle mod list column`;

        constructor(
            public column: string
        ) {}
    }

    export class ResetModListColumns {
        public static readonly type = `[app] reset mod list columns`;
    }
}