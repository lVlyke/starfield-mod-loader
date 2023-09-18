import { ModProfileRef } from "../../models/mod-profile-ref";
import { AppProfile } from "../../models/app-profile";
import { BasicAction } from "../basic-action";

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
}