import { ModProfileRef } from "./mod-profile-ref";
import { GamePluginProfileRef } from "./game-plugin-profile-ref";
import { GameId } from "./game-id";
import { RelativeOrderedMap } from "../util/relative-ordered-map";
import { GameAction } from "./game-action";
import { ModSection } from "./mod-section";

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
    rootModSections?: ModSection[];
    modSections?: ModSection[];
}

export interface AppProfile extends AppBaseProfile {
    gameRootDir: string;
    gameModDir: string;
    gameBinaryPath: string;
    gamePluginListPath?: string;
    gameConfigFilePath?: string;
    gameSaveFolderPath?: string;
    steamGameId?: string;
    manageExternalPlugins?: boolean;
    manageSaveFiles?: boolean;
    manageSteamCompatSymlinks?: boolean;
    modLinkMode?: boolean;
    configLinkMode?: boolean;
    externalFilesCache?: AppProfile.ExternalFiles;
    baseProfile?: AppBaseProfile;
    customGameActions?: GameAction[];
    activeGameAction?: GameAction;
}

export type AppProfileModList = AppProfile.ModList;
export type AppProfileForm = AppProfile.Form;
export type AppProfileDefaultablePaths = AppProfile.DefaultablePaths;
export type AppProfileCollectedVerificationResult = AppProfile.CollectedVerificationResult;
export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfilePluginBackupEntry = AppProfile.PluginBackupEntry;
export type AppProfileDescription = AppProfile.Description;
export type AppProfileExternalFiles = AppProfile.ExternalFiles;
export type AppProfileSave = AppProfile.Save;

export namespace AppProfile {

    export type ModList = RelativeOrderedMap.List<string, ModProfileRef>;

    export type Description = Pick<AppBaseProfile, "name" | "gameId" | "deployed" | "rootPathOverride"> & { baseProfile?: string };
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

    export interface Save {
        name: string;
        date: Date;
    }

    export interface VerificationResult {
        error: boolean;
        found: boolean;
        reason?: string;
    }

    export type VerificationResultRecord<K extends string | number | symbol = string> = Record<
        K,
        VerificationResult | CollectedVerificationResult
    >;

    export interface CollectedVerificationResult<K extends string | number | symbol = string> extends VerificationResult {
        results: VerificationResultRecord<K>;
    }

    export interface PropertiesVerificationResult extends VerificationResultRecord<keyof AppProfile> {
        mods: CollectedVerificationResult;
        rootMods: CollectedVerificationResult;
        plugins: CollectedVerificationResult;
    }

    export interface VerificationResults extends VerificationResult {
        properties: PropertiesVerificationResult;
    }

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