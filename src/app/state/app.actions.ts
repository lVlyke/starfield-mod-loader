import { BasicAction } from "./basic-action";
import { AppData } from "../models/app-data";
import { AppProfile } from "../models/app-profile";

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
    export type ModsActivatedAction = BasicAction<AppData, "modsActivated">;
    export type DeployInProgressAction = BasicAction<AppData, "deployInProgress">;

    export const updateActiveProfile = createUpdateAction("activeProfile");
    export const activateMods = createUpdateAction("modsActivated");
    export const setDeployInProgress = createUpdateAction("deployInProgress");

    export class SetProfiles {
        public static readonly type = `[app] set profiles`;

        constructor(
            public profileNames?: string[]
        ) {}
    }

    export class AddProfile {
        public static readonly type = `[app] add profile`;

        constructor(
            public profile: AppProfile
        ) {}
    }
}