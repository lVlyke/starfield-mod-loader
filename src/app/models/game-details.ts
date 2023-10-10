export interface GameDetails {
    title: string;
    modBaseDirs?: string[];
    gameBaseDirs?: string[];
    gameBinaryPaths?: string[];
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