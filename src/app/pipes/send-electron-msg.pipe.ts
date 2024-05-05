import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { AppMessage } from "../models/app-message";
import { ElectronUtils } from "../util/electron-utils";

@Pipe({
    name: "appSendElectronMsg$"
})
export class AppSendElectronMsgPipe implements PipeTransform {

    public transform<T = any>(channel: AppMessage["id"], ...args: any[]): Observable<T> {
        return ElectronUtils.invoke<T>(channel, ...args);
    }
}
