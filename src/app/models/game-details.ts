export interface GameDetails {
    title: string;
    pluginFormats: string[];
    modBaseDirs?: string[];
    gameBaseDirs?: string[];
    gameBinaryPaths?: string[];
    pluginListPaths?: string[];
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