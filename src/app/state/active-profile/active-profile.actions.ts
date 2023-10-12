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

    export const setDeployed = createUpdateAction("deployed");

    export class AddMod {
        public static readonly type = `[activeProfile] add mod`;

        constructor(
            public name: string,
            public mod: ModProfileRef
        ) {}
    }

    export class DeleteMod {
        public static readonly type = `[activeProfile] delete mod`;

        constructor(
            public name: string
        ) {}
    }

    export class RenameMod {
        public static readonly type = `[activeProfile] rename mod`;

        constructor(
            public curName: string,
            public newName: string
        ) {}
    }

    export class UpdateModVerification {
        public static readonly type = `[activeProfile] update mod verification`;

        constructor(
            public modName: string,
            public verificationResult?: AppProfile.ModVerificationResult
        ) {}
    }

    export class UpdateModVerifications {
        public static readonly type = `[activeProfile] update mod verifications`;

        constructor(
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
            public modOrder: string[]
        ) {}
    }

    export class ReconcilePluginList {
        public static readonly type = `[activeProfile] reconcile plugin list`;
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