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
    export type PluginListPathAction = BasicAction<AppProfile, "pluginListPath">;

    export const setDeployed = createUpdateAction("deployed");
    export const setPluginListPath = createUpdateAction("pluginListPath");

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
            public verificationResult?: AppProfile.ModVerificationResult
        ) {}
    }

    export class UpdateModVerifications {
        public static readonly type = `[activeProfile] update mod verifications`;

        constructor(
            public root: boolean,
            public modVerificationResults: Record<string, AppProfile.ModVerificationResult | undefined>
        ) {}
    }

    export class UpdateManualMods {
        public static readonly type = `[activeProfile] update manual mods`;

        constructor(
            public manualMods: string[]
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