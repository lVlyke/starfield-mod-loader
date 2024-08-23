import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable } from "rxjs";
import { ElectronUtils } from "../util/electron-utils";
import { AppProfile } from "../models/app-profile";

@Pipe({
    name: "appProfileConfigFile$"
})
export class AppProfileConfigFilePipe implements PipeTransform {

    public transform(
        profile: AppProfile | undefined | null,
        configFileName: string | undefined,
        _lastUpdate?: Date | null,
        loadDefaults: boolean = false
    ): Observable<string> {
        if (!configFileName || !profile) {
            return NEVER;
        }

        return ElectronUtils.invoke("profile:readConfigFile", { profile, fileName: configFileName, loadDefaults });
    }
}
