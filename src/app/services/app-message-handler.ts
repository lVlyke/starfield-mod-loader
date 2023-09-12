import { Injectable, NgZone } from "@angular/core";
import { Subject } from 'rxjs';
import { AppMessage } from "../models/app-message";
import { ElectronUtils } from '../util/electron-utils';

@Injectable({ providedIn: "root" })
export class AppMessageHandler {

    private readonly _messages$ = new Subject<AppMessage>();
    public readonly messages$ = this._messages$.asObservable();

    constructor(zone: NgZone) {
        const electron = ElectronUtils.electron;

        if (!!electron) {
            AppMessage.record.forEach((id) => electron.ipcRenderer.on(id, (_, data) => {
                zone.run(() => this._messages$.next({ id, data }));
            }));
        }
    }
}