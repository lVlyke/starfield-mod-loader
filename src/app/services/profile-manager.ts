import { Inject, Injectable, forwardRef } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import { delay, map, switchMap, take, tap } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { ElectronUtils } from "../util/electron-utils";
import { ObservableUtils } from "../util/observable-utils";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";
import { AppProfile } from "../models/app-profile";
import { AppActions, AppState } from "../state";
import { AppData } from "../models/app-data";

@Injectable({ providedIn: "root" })
export class ProfileManager {

    @Select(AppState)
    public readonly appState$!: Observable<AppData>;

    constructor(
        messageHandler: AppMessageHandler,
        @Inject(forwardRef(() => Store)) private readonly store: Store
    ) {
        // Wait for NGXS to load
        of(true).pipe(delay(0)).subscribe(() => {
            ElectronUtils.invoke<AppSettingsUserCfg | null>("app:loadSettings").subscribe((settings) => {
                if (settings?.activeProfile) {
                    this.loadProfile(settings.activeProfile, true);
                } else {
                    this.createProfile("Default", true);
                    this.saveSettings();
                }
            });
        });
    }

    public saveSettings(): Observable<void> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            map(appState => this.appDataToUserCfg(appState)),
            switchMap(settings => ElectronUtils.invoke("app:saveSettings", { settings }))
        ));
    }

    public loadProfile(profileName: string, setActive: boolean = true): Observable<AppProfile> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppProfile>("app:loadProfile", { name: profileName }).pipe(
            tap((profile) => {
                if (setActive) {
                    this.setActiveProfile(profile);
                }
            })
        ));
    }

    public createProfile(profileName: string, setActive: boolean = true): Observable<AppProfile> {
        const profile = AppProfile.create(profileName);

        if (setActive) {
            this.setActiveProfile(profile);
        }

        return ElectronUtils.invoke<AppProfile>("app:saveProfile", profile);
    }

    public setActiveProfile(profile: AppProfile): Observable<any> {
        return this.store.dispatch(new AppActions.updateActiveProfile(profile));
    }

    private appDataToUserCfg(appData: AppData): AppSettingsUserCfg {
        return {
            activeProfile: appData.activeProfile?.name
        };
    }
}