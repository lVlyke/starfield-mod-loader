import { ModProfileRef } from "./mod-profile-ref";
import { GamePluginProfileRef } from "./game-plugin-profile-ref";
import { GameId } from "./game-id";

export interface AppProfile {
    name: string;
    gameId: GameId;
    gameBaseDir: string;
    modBaseDir: string;
    gameBinaryPath: string;
    pluginListPath?: string;
    mods: Map<string, ModProfileRef>;
    plugins: GamePluginProfileRef[];
    manualMods?: string[];
    deployed: boolean;
}

export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfileModVerificationResult = AppProfile.ModVerificationResult;
export type AppProfilePluginBackupEntry = AppProfile.PluginBackupEntry;

export namespace AppProfile {

    export interface VerificationResult {
        error: boolean;
        found: boolean;
    }

    export type VerificationResults = {
        [K in keyof Partial<AppProfile>]: VerificationResult;
    };

    export type ModVerificationResult = VerificationResults["mods"];
    export type PluginVerificationResult = VerificationResults["plugins"];

    export interface PluginBackupEntry {
        filePath: string;
        backupDate: Date;
    }

    export function create(name: string, gameId: GameId): AppProfile {
        return {
            name,
            gameId,
            gameBaseDir: "",
            modBaseDir: "",
            gameBinaryPath: "",
            mods: new Map(),
            plugins: [],
            deployed: false
        };
    }
}