import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { ExternalFile } from "../models/external-file";
import { AppStateBehaviorManager } from "../services/app-state-behavior-manager";

@Pipe({
    name: "appExternalImage$"
})
export class AppExternalImagePipe implements PipeTransform {

    constructor (private readonly appManager: AppStateBehaviorManager) {}

    public transform(path: string): Observable<ExternalFile> {
        return this.appManager.openFile(path);
    }
}
