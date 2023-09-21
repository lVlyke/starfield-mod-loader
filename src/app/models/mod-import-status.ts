import { AppProfile } from "./app-profile";
import { ModProfileRef } from "./mod-profile-ref";

export type ModImportStatus = "FAILED" | "PENDING" | "CANCELED";

export interface ModImportRequest {
    profile: AppProfile;
    modName: string;
    importStatus: ModImportStatus;
    externalImport: boolean;
    modPath: string;
    modFilePaths: ModImportRequest.ModPathReference[];
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