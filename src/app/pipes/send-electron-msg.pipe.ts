import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { AppMessage, AppMessageData, AppMessageResult } from "../models/app-message";
import { ElectronUtils } from "../util/electron-utils";

@Pipe({
    name: "appSendElectronMsg$"
})
export class AppSendElectronMsgPipe implements PipeTransform {

    public transform<M extends AppMessage["id"] = AppMessage["id"]>(channel: M, data: AppMessageData<M>): Observable<AppMessageResult<M>> {
        return ElectronUtils.invoke<M>(channel, data);
    }
}
