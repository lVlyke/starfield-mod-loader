import { ModProfileRef } from "./mod-profile-ref";

export interface AppProfile {
    name: string;
    gameBaseDir: string;
    modBaseDir: string;
    gameBinaryPath: string;
    mods: Map<string, ModProfileRef>;
}

export namespace AppProfile {

    export function create(name: string): AppProfile {
        return {
            name,
            gameBaseDir: "",
            modBaseDir: "",
            gameBinaryPath: "",
            mods: new Map()
        };
    }
}