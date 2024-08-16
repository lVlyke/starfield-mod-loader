import { Pipe, PipeTransform } from "@angular/core";
import { AppProfile } from "../models/app-profile";

@Pipe({
    name: "appProfileActiveModCount"
})
export class AppProfileActiveModCountPipe implements PipeTransform {

    public transform(profile: AppProfile, includeRootMods: boolean = true): number {
        let count = 0;

        if (includeRootMods) {
            profile.rootMods.forEach(([, mod]) => {
                if (mod.enabled) {
                    ++count;
                }
            });
        }

        profile.mods.forEach(([, mod]) => {
            if (mod.enabled) {
                ++count;
            }
        });
        return count;
    }
}
