import { ModProfileRef } from "../../models/mod-profile-ref";
import { AppProfile } from "../../models/app-profile";
import { BasicAction } from "../basic-action";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";

export namespace ActiveProfileActions {

    function createBasicAction(property: keyof AppProfile, action: string): BasicAction.Constructor<AppProfile, keyof AppProfile> {
        return BasicAction.create<AppProfile, keyof AppProfile>(
            "project",
            action,
            property
        );
    }

    function createUpdateAction(property: keyof AppProfile): BasicAction.Constructor<AppProfile, keyof AppProfile> {
        return createBasicAction(property, "update");
    }

    export type DeployedAction = BasicAction<AppProfile, "deployed">;
    export type ManageExternalPluginsAction = BasicAction<AppProfile, "manageExternalPlugins">;
    export type PluginListPathAction = BasicAction<AppProfile, "pluginListPath">;

    export const setDeployed = createUpdateAction("deployed");
    export const setPluginListPath = createUpdateAction("pluginListPath");
    export const manageExternalPlugins = createUpdateAction("manageExternalPlugins");

    export class AddMod {
        public static readonly type = `[activeProfile] add mod`;

        constructor(
            public root: boolean,
            public name: string,
            public mod: ModProfileRef
        ) {}
    }

    export class DeleteMod {
        public static readonly type = `[activeProfile] delete mod`;

        constructor(
            public root: boolean,
            public name: string
        ) {}
    }

    export class RenameMod {
        public static readonly type = `[activeProfile] rename mod`;

        constructor(
            public root: boolean,
            public curName: string,
            public newName: string
        ) {}
    }

    export class UpdateModVerification {
        public static readonly type = `[activeProfile] update mod verification`;

        constructor(
            public root: boolean,
            public modName: string,
            public verificationResult?: AppProfile.VerificationResult
        ) {}
    }

    export class UpdateModVerifications {
        public static readonly type = `[activeProfile] update mod verifications`;

        constructor(
            public root: boolean,
            public modVerificationResults: AppProfile.ModVerificationResults
        ) {}
    }

    export class UpdateExternalFiles {
        public static readonly type = `[activeProfile] update external files`;

        constructor(
            public externalFiles: AppProfile.ExternalFiles
        ) {}
    }

    export class ReorderMods {
        public static readonly type = `[activeProfile] reorder mods`;

        constructor(
            public root: boolean,
            public modOrder: string[]
        ) {}
    }

    export class ReconcilePluginList {
        public static readonly type = `[activeProfile] reconcile plugin list`;

        constructor(
            public pluginTypeOrder?: string[]
        ) {}
    }

    export class UpdatePlugins {
        public static readonly type = `[activeProfile] update plugins`;

        constructor(
            public plugins: GamePluginProfileRef[]
        ) {}
    }

    export class UpdatePlugin {
        public static readonly type = `[activeProfile] update plugin`;

        constructor(
            public plugin: GamePluginProfileRef
        ) {}
    }
}