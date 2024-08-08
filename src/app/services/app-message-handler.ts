import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { AppMessage, AppMessageData } from "../models/app-message";

@Injectable({ providedIn: "root" })
export class AppMessageHandler {

    private readonly _messages$ = new Subject<AppMessage>();
    public readonly messages$ = this._messages$.asObservable();

    constructor(zone: NgZone) {
        AppMessage.record.forEach((id: AppMessage["id"]) => window.appMessenger.on(id, (_: any, data: AppMessageData<typeof id>) => {
            zone.run(() => this._messages$.next({ id, data } as AppMessage));
        }));
    }
}