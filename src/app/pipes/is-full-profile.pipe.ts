import { Pipe, PipeTransform } from "@angular/core";
import { AppProfile } from "../models/app-profile";

@Pipe({
    name: "appIsFullProfile",
    standalone: false
})
export class AppIsFullProfilePipe implements PipeTransform {

    public transform(value?: Partial<AppProfile>): value is AppProfile {
        return AppProfile.isFullProfile(value);
    }
}
