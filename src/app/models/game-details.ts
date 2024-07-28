import type { GamePluginListType } from "./game-plugin-list-type";

export interface GameDetails {
    title: string;
    pluginFormats: string[];
    requireExternalPlugins: boolean;
    bkgColor?: string;
    fgColor?: string;
    modBaseDirs?: string[];
    gameBaseDirs?: string[];
    gameBinaryPaths?: string[];
    pluginListPaths?: string[];
    configFilePaths?: string[];
    pluginListType?: GamePluginListType;
    pinnedPlugins?: GameDetails.PinnedPlugin[];
    gameConfigFiles?: Record<string, string[]>;
    scriptExtenders?: GameDetails.ScriptExtender[];
    resources?: GameDetails.Resources;
    archiveInvalidation?: GameDetails.ArchiveInvalidationConfig;
}

export namespace GameDetails {

    export type ArchiveInvalidationConfig = Record<string, string>;

    export interface ScriptExtender {
        name: string;
        binaries: string[];
        modPaths: string[];
    }

    export interface PinnedPlugin {
        plugin: string;
        required?: boolean;
    }
    export interface Resources {
        mods: Record<string, string>;
    }
}