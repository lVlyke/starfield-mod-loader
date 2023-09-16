import { ModProfileRef } from "./mod-profile-ref";

export interface AppProfile {
    name: string;
    gameBaseDir: string;
    modBaseDir: string;
    gameBinaryPath: string;
    mods: Map<string, ModProfileRef>;
    manualMods?: string[];
}

export namespace AppProfile {

    export interface VerificationResult {
        error: boolean;
        found: boolean;
    }

    export type VerificationResults = {
        [K in keyof AppProfile]: VerificationResult;
    };

    export type ModVerificationResult = VerificationResults["mods"];

    export function create(name: string): AppProfile {
        return {
            name,
            gameBaseDir: "",
            modBaseDir: "",
            gameBinaryPath: "",
            mods: new Map()
        };
    }
}