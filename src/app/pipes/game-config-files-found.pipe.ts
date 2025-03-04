import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable } from "rxjs";
import { ElectronUtils } from "../util/electron-utils";
import { GameDetails } from "../models/game-details";

@Pipe({
    name: "appGameConfigFilesFound$",
    standalone: false
})
export class AppGameConfigFilesFoundPipe implements PipeTransform {

    public transform(gameDetails?: GameDetails): Observable<string | undefined> {
        if (!gameDetails) {
            return NEVER;
        }

        return ElectronUtils.invoke("app:verifyPathExists", {
            path: Object.values(gameDetails.gameConfigFiles ?? {}).flat()
        });
    }
}
