import type { GamePluginListType } from "./game-plugin-list-type";

export interface GameDetails {
    title: string;
    pluginFormats: string[];
    bkgColor?: string;
    fgColor?: string;
    modBaseDirs?: string[];
    gameBaseDirs?: string[];
    gameBinaryPaths?: string[];
    pluginListPaths?: string[];
    pluginListType?: GamePluginListType;
    gameConfigFiles?: Record<string, string[]>;
    scriptExtenders?: GameDetails.ScriptExtender[];
}

export namespace GameDetails {

    export interface ScriptExtender {
        name: string;
        binaries: string[];
        modPaths: string[];
    }
}