import { ModProfileRef } from "./mod-profile-ref";

export interface AppProfile {
    name: string;
    gameBaseDir: string;
    modBaseDir: string;
    mods: Record<string, ModProfileRef>;
}

export namespace AppProfile {

    export function create(name: string): AppProfile {
        return {
            name,
            gameBaseDir: "TODO",
            modBaseDir: "TODO",
            mods: {}
        };
    }
}