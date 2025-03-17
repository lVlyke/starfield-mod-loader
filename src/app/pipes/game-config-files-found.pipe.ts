import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable } from "rxjs";
import { ElectronUtils } from "../util/electron-utils";
import { GameDetails } from "../models/game-details";
import { AppProfile } from "../models/app-profile";

@Pipe({ name: "appGameConfigFilesFound$" })
export class AppGameConfigFilesFoundPipe implements PipeTransform {

    public transform(
        gameDetails: GameDetails | null | undefined,
        profile: Partial<AppProfile | AppProfile.Form>
    ): Observable<string | undefined> {
        if (!gameDetails) {
            return NEVER;
        }

        if (!profile.gameInstallation?.configFilePath) {
            return NEVER;
        }

        return ElectronUtils.invoke("app:verifyPathExists", {
            path: gameDetails.gameConfigFiles?.map((configFileName) => { 
                return `${profile.gameInstallation!.configFilePath}/${configFileName}`;
            }) ?? []
        });
    }
}
