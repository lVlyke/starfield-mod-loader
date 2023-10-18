import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable } from "rxjs";
import { ExternalFile } from "../models/external-file";
import { ModImportRequest } from "../models/mod-import-status";
import { AppStateBehaviorManager } from "../services/app-state-behavior-manager";

@Pipe({
    name: "appModImportRequestImage$"
})
export class AppModImportRequestImagePipe implements PipeTransform {

    constructor (private readonly appManager: AppStateBehaviorManager) {}

    public transform(path: string | undefined, importRequest: ModImportRequest): Observable<ExternalFile> {
        if (!path) {
            return NEVER;
        }
        
        return this.appManager.openFile(
            importRequest.modPath + importRequest.filePathSeparator + path
        );
    }
}
