import { ModProfileRef } from "./mod-profile-ref";
import { GamePluginProfileRef } from "./game-plugin-profile-ref";
import { GameId } from "./game-id";
import { RelativeOrderedMap } from "../util/relative-ordered-map";

export interface AppBaseProfile {
    name: string;
    gameId: GameId;
    mods: AppProfile.ModList;
    rootMods: AppProfile.ModList;
    plugins: GamePluginProfileRef[];
    manageConfigFiles?: boolean;
    rootPathOverride?: string;
    modsPathOverride?: string;
    configPathOverride?: string;
    savesPathOverride?: string;
    backupsPathOverride?: string;
    deployed?: boolean;
}

export interface AppProfile extends AppBaseProfile {
    gameRootDir: string;
    gameModDir: string;
    gameBinaryPath: string;
    gamePluginListPath?: string;
    gameConfigFilePath?: string;
    gameSaveFolderPath?: string;
    manageExternalPlugins?: boolean;
    manageSaveFiles?: boolean;
    modLinkMode?: boolean;
    configLinkMode?: boolean;
    externalFilesCache?: AppProfile.ExternalFiles;
    baseProfile?: AppBaseProfile;
}

export type AppProfileModList = AppProfile.ModList;
export type AppProfileForm = AppProfile.Form;
export type AppProfileDefaultablePaths = AppProfile.DefaultablePaths;
export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfileModVerificationResults = AppProfile.ModVerificationResults;
export type AppProfilePluginBackupEntry = AppProfile.PluginBackupEntry;
export type AppProfileDescription = AppProfile.Description;
export type AppProfileExternalFiles = AppProfile.ExternalFiles;

export namespace AppProfile {

    export type ModList = RelativeOrderedMap.List<string, ModProfileRef>;

    export type Description = Pick<AppBaseProfile, "name" | "gameId" | "deployed"> & { baseProfile?: string };
    export type Form = Omit<AppProfile, "baseProfile"> & { baseProfile?: string; };
    export type DefaultablePaths = Pick<AppProfile,
          "gameRootDir"
        | "gameModDir"
        | "gameBinaryPath"
        | "gamePluginListPath"
        | "gameConfigFilePath"
        | "gameSaveFolderPath"
        | "rootPathOverride"
        | "modsPathOverride"
        | "savesPathOverride"
        | "configPathOverride"
        | "backupsPathOverride"
    >;

    export interface ExternalFiles {
        gameDirFiles: string[];
        modDirFiles: string[];
        pluginFiles: string[];
    }

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

    export const BASE_PROFILE_KEYS: Array<keyof AppBaseProfile> = [
        "name",
        "gameId",
        "mods",
        "rootMods",
        "plugins",
        "manageConfigFiles",
        "rootPathOverride",
        "modsPathOverride",
        "configPathOverride",
        "savesPathOverride",
        "backupsPathOverride",
        "deployed"
    ];

    export function isFullProfile(value?: Partial<AppProfile>): value is AppProfile {
        return !!value && "gameRootDir" in value && "gameModDir" in value;
    }

    export function create(name: string, gameId: GameId): AppProfile;
    export function create(name: string): Partial<AppProfile>;
    export function create(name: string, gameId?: GameId): Partial<AppProfile> {
        return {
            name,
            gameId,
            gameRootDir: "",
            gameModDir: "",
            gameBinaryPath: "",
            mods: [],
            rootMods: [],
            plugins: [],
            deployed: false
        };
    }

    export function asDescription(profile: AppBaseProfile): AppProfile.Description {
        return {
            name: profile.name,
            gameId: profile.gameId,
            deployed: profile.deployed,
            baseProfile: isFullProfile(profile) ? profile.baseProfile?.name : undefined
        };
    }
}