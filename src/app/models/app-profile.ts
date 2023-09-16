import { ModProfileRef } from "./mod-profile-ref";
import { GameId } from "./game-id";

export interface AppProfile {
    name: string;
    gameId: GameId;
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

    export function create(name: string, gameId: GameId): AppProfile {
        return {
            name,
            gameId,
            gameBaseDir: "",
            modBaseDir: "",
            gameBinaryPath: "",
            mods: new Map()
        };
    }
}