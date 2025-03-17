import type { GamePluginListType } from "./game-plugin-list-type";
import type { GameInstallation } from "./game-installation";

export interface GameDetails {
    title: string;
    installations: GameInstallation[];
    gameBinary: string[];
    pluginFormats: string[];
    saveFormats: string[];
    requireExternalPlugins: boolean;
    bkgColor?: string;
    fgColor?: string;
    pluginListType?: GamePluginListType;
    pinnedPlugins?: GameDetails.PinnedPlugin[];
    gameConfigFiles?: string[];
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