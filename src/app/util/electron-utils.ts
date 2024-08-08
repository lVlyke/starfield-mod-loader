import type { AppMessage } from "../models/app-message";
import { Observable, from } from "rxjs";

export namespace ElectronUtils {

    export function invoke<T = any>(channel: AppMessage["id"], ...args: any[]): Observable<T> {
        return from(window.appMessenger.invoke<T>(channel, ...args) ?? Promise.resolve());
    }

    export function chooseDirectory(baseDir?: string): Observable<string | undefined> {
        return invoke("app:chooseDirectory", { baseDir });
    }

    export function chooseFilePath(baseDir?: string, fileTypes?: string[]): Observable<string | undefined> {
        return invoke("app:chooseFilePath", { baseDir, fileTypes });
    }
}
