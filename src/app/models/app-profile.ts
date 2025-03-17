import { ModProfileRef } from "./mod-profile-ref";
import { GamePluginProfileRef } from "./game-plugin-profile-ref";
import { GameId } from "./game-id";
import { RelativeOrderedMap } from "../util/relative-ordered-map";
import { GameAction } from "./game-action";
import { ModSection } from "./mod-section";
import { GameInstallation } from "./game-installation";

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
    locked?: boolean;
    rootModSections?: ModSection[];
    modSections?: ModSection[];
}

export interface AppProfile extends AppBaseProfile {
    gameInstallation: GameInstallation;
    steamCustomGameId?: string;
    manageExternalPlugins?: boolean;
    manageSaveFiles?: boolean;
    manageSteamCompatSymlinks?: boolean;
    modLinkMode?: boolean;
    configLinkMode?: boolean;
    externalFilesCache?: AppProfile.ExternalFiles;
    baseProfile?: AppBaseProfile;
    defaultGameActions: GameAction[];
    customGameActions?: GameAction[];
    activeGameAction?: GameAction;
}

export type AppProfileModList = AppProfile.ModList;
export type AppProfileForm = AppProfile.Form;
export type AppProfileCollectedVerificationResult = AppProfile.CollectedVerificationResult;
export type AppProfileVerificationResult = AppProfile.VerificationResult;
export type AppProfileVerificationResults = AppProfile.VerificationResults;
export type AppProfileBackupEntry = AppProfile.BackupEntry;
export type AppProfileModOrderBackupEntry = AppProfile.ModOrderBackupEntry;
export type AppProfileModOrderBackup = AppProfile.ModOrderBackup;
export type AppProfileDescription = AppProfile.Description;
export type AppProfileExternalFiles = AppProfile.ExternalFiles;
export type AppProfileSave = AppProfile.Save;

export namespace AppProfile {

    export type ModList = RelativeOrderedMap.List<string, ModProfileRef>;

    export type Description = Pick<AppBaseProfile, "name" | "gameId" | "deployed" | "rootPathOverride"> & { baseProfile?: string };
    export type Form = Omit<AppProfile, "baseProfile"> & { baseProfile?: string; };

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

    export interface CollectedVerificationResult<K extends string | number | symbol = string> {
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

    export interface BackupEntry {
        filePath: string;
        backupDate: Date;
    }

    export interface ModOrderBackupEntry {
        name: string;
        enabled: boolean;
    }

    export interface ModSectionBackupEntry {
        name: string;
        modBefore?: string;
        iconName?: string;
    }

    export interface ModOrderBackup {
        rootMods: ModOrderBackupEntry[];
        mods: ModOrderBackupEntry[];
        rootModSections?: ModSectionBackupEntry[];
        modSections?: ModSectionBackupEntry[];
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
        return !!value && "gameInstallation" in value;
    }

    export function create(name: string, gameId: GameId): AppProfile;
    export function create(name: string): Partial<AppProfile>;
    export function create(name: string, gameId?: GameId): Partial<AppProfile> {
        return {
            name,
            gameId,
            gameInstallation: GameInstallation.empty(),
            mods: [],
            rootMods: [],
            plugins: [],
            defaultGameActions: [],
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