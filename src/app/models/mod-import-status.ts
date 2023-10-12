import { AppProfile } from "./app-profile";
import { ModProfileRef } from "./mod-profile-ref";

export type ModImportStatus = "FAILED" | "PENDING" | "CANCELED";
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
}

export interface ModImportResult {
    modName: string;
    modRef: ModProfileRef;
}

export namespace ModImportRequest {

    export interface ModPathReference {
        filePath: string;
        enabled: boolean;
    }
}