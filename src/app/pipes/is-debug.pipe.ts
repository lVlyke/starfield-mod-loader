import { Pipe, PipeTransform } from "@angular/core";
import { environment } from "../../environments/environment";

@Pipe({
    name: "appIsDebug",
    pure: false,
    standalone: false
})
export class AppIsDebugPipe implements PipeTransform {

    public transform(_value?: unknown): boolean {
        return !environment.production;
    }
}
