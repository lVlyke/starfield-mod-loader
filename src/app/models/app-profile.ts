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
    mods: AppProfile.ModList;
    rootMods: AppProfile.ModList;
    plugins: GamePluginProfileRef[];
    manualMods?: string[];
    deployed: boolean;
}

export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfileModVerificationResults = AppProfile.ModVerificationResults;
export type AppProfilePluginBackupEntry = AppProfile.PluginBackupEntry;
export type AppProfileDescription = AppProfile.Description;

export namespace AppProfile {

    export type ModList = Map<string, ModProfileRef>;

    export type Description = Pick<AppProfile, "name" | "gameId" | "deployed">;

    export interface VerificationResult {
        error: boolean;
        found: boolean;
    }

    export interface CollectedVerificationResult<K extends string | number | symbol = string> extends VerificationResult {
        results: Record<K, VerificationResult>;
    }

    export type BaseVerificationResults = VerificationResult & {
        [K in keyof Required<AppProfile>]: VerificationResult;
    };

    export interface VerificationResults extends BaseVerificationResults {
        mods: CollectedVerificationResult;
        rootMods: CollectedVerificationResult;
        plugins: CollectedVerificationResult;
    }

    export type ModVerificationResults = VerificationResults["mods"];
    export type PluginVerificationResults = VerificationResults["plugins"];

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
            rootMods: new Map(),
            plugins: [],
            deployed: false
        };
    }
}