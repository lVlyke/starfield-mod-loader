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

export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfileModVerificationResult = AppProfile.ModVerificationResult;

export namespace AppProfile {

    export interface VerificationResult {
        error: boolean;
        found: boolean;
    }

    export type VerificationResults = {
        [K in keyof Partial<AppProfile>]: VerificationResult;
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