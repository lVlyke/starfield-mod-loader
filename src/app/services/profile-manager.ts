import * as _ from "lodash";
import { Inject, Injectable, forwardRef } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import { delay, distinctUntilChanged, filter, map, switchMap, take, tap } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { filterDefined } from "../core/operators/filter-defined";
import { ElectronUtils } from "../util/electron-utils";
import { ObservableUtils } from "../util/observable-utils";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";
import { AppProfile } from "../models/app-profile";
import { AppActions, AppState } from "../state";
import { AppData } from "../models/app-data";
import { ActiveProfileActions } from "../state/active-profile/active-profile.actions";
import { ModProfileRef } from "../models/mod-profile-ref";

@Injectable({ providedIn: "root" })
export class ProfileManager {

    @Select(AppState)
    public readonly appState$!: Observable<AppData>;

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    constructor(
        messageHandler: AppMessageHandler,
        @Inject(forwardRef(() => Store)) private readonly store: Store
    ) {
        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:addMod"),
            switchMap(() => this.addModFromUser())
        ).subscribe();
        
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

            // Save profile settings to disk on changes
            this.activeProfile$.pipe(
                filterDefined(),
                distinctUntilChanged(_.isEqual),
                switchMap(profile => this.saveProfile(profile))
            ).subscribe();
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
            switchMap((profile) => {
                if (!profile) {
                    // TODO - Show error
                    return this.createProfile(profileName);
                }

                if (setActive) {
                    this.setActiveProfile(profile);
                }

                return of(profile);
            })
        ));
    }

    public saveProfile(profile: AppProfile): Observable<any> {
        return ObservableUtils.hotResult$(
            ElectronUtils.invoke<AppProfile>("app:saveProfile", { profile })
        );
    }

    public createProfile(profileName: string, setActive: boolean = true): Observable<AppProfile> {
        const profile = AppProfile.create(profileName);

        if (setActive) {
            this.setActiveProfile(profile);
        }

        return this.saveProfile(profile);
    }

    public setActiveProfile(profile: AppProfile): Observable<any> {
        return this.store.dispatch(new AppActions.updateActiveProfile(profile));
    }

    public addModFromUser(): Observable<ModProfileRef> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            switchMap(({ activeProfile }) => ElectronUtils.invoke("profile:addMod", { profile: activeProfile })),
            tap((result) => {
                if (!result) {
                    alert("Failed to add mod.");
                }
            }),
            filterDefined(),
            switchMap(({ name, modRef }) => this.store.dispatch(new ActiveProfileActions.AddMod(name, modRef)).pipe(
                map(() => modRef)
            ))
        ));
    }

    public updateMod(name: string, modRef: ModProfileRef): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.AddMod(name, modRef));
    }

    private appDataToUserCfg(appData: AppData): AppSettingsUserCfg {
        return {
            activeProfile: appData.activeProfile?.name
        };
    }
}