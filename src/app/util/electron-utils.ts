import type { AppMessage, AppMessageData, AppMessageResult } from "../models/app-message";
import { Observable, from } from "rxjs";

export namespace ElectronUtils {

    export function invoke<M extends AppMessage["id"]>(channel: M, data: AppMessageData<M>): Observable<AppMessageResult<M>> {
        return from(window.appMessenger.invoke<AppMessageResult<M>>(channel, data) ?? Promise.resolve());
    }

    export function chooseDirectory(baseDir?: string): Observable<string | undefined> {
        return invoke("app:chooseDirectory", { baseDir });
    }

    export function chooseFilePath(baseDir?: string, fileTypes?: string[]): Observable<string | undefined> {
        return invoke("app:chooseFilePath", { baseDir, fileTypes });
    }
}
