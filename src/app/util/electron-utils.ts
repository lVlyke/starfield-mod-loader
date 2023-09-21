import type * as _electron from "electron";
import type { AppMessage } from "../models/app-message";
import { Observable, from } from "rxjs";

export namespace ElectronUtils {

    export const electron: typeof _electron | undefined = window.require?.("electron");

    export function invokeRaw<T = any>(channel: string, ...args: any[]): Observable<T> {
        return from(electron?.ipcRenderer.invoke(channel, ...args) ?? Promise.resolve());
    }

    export function invoke<T = any>(channel: AppMessage["id"], ...args: any[]): Observable<T> {
        return invokeRaw<T>(channel, ...args);
    }

    export function chooseDirectory(baseDir?: string): Observable<string | undefined> {
        return invoke("app:chooseDirectory", { baseDir });
    }

    export function chooseFilePath(baseDir?: string, fileTypes?: string[]): Observable<string | undefined> {
        return invoke("app:chooseFilePath", { baseDir, fileTypes });
    }
}
