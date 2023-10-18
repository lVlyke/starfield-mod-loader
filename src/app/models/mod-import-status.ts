import { AppProfile } from "./app-profile";
import { ModProfileRef } from "./mod-profile-ref";
import { ModInstaller } from "./mod-installer";

export type ModImportStatus = "FAILED" | "PENDING" | "MANUALINSTALL" | "CANCELED";
export type ModImportMergeStrategy = "REPLACE" | "OVERWRITE" | "ADD";

export interface ModImportRequest {
    profile: AppProfile;
    modName: string;
    importStatus: ModImportStatus;
    mergeStrategy: ModImportMergeStrategy;
    externalImport: boolean;
    modPath: string;
    modFilePaths: ModImportRequest.ModPathReference[];
    modPlugins: string[];
    filePathSeparator: string;
    modSubdirRoot: string;
    installer?: ModInstaller;
    modFilePathMapFilter?: Record<string, string>;
}

export interface ModImportResult {
    modName: string;
    modRef: ModProfileRef;
}

export namespace ModImportRequest {

    export interface ModPathReference {
        enabled: boolean;
        filePath: string;
        mappedFilePath?: string;
    }
}