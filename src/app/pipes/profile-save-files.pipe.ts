import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable } from "rxjs";
import { ElectronUtils } from "../util/electron-utils";
import { AppProfile } from "../models/app-profile";

@Pipe({ name: "appProfileSaveFiles$" })
export class AppProfileSaveFilesPipe implements PipeTransform {

    public transform(
        profile: AppProfile | undefined | null
    ): Observable<AppProfile.Save[]> {
        if (!profile) {
            return NEVER;
        }

        return ElectronUtils.invoke("profile:readSaveFiles", { profile });
    }
}
