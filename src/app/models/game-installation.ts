export interface GameInstallation {
    rootDir: string;
    modDir: string;
    configFilePath: string;
    saveFolderPath: string;
    pluginListPath?: string;
    steamId?: string[];
}

export namespace GameInstallation {

    export function empty(): GameInstallation {
        return {
            rootDir: "",
            modDir: "",
            configFilePath: "",
            saveFolderPath: ""
        };
    }
}