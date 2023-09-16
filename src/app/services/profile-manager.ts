import * as _ from "lodash";
import { Inject, Injectable, forwardRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import { delay, distinctUntilChanged, filter, map, mergeMap, mergeScan, skip, switchMap, take, tap, toArray } from "rxjs/operators";
import { Observable, combineLatest, concat, forkJoin, from, of } from "rxjs";
import { filterDefined } from "../core/operators/filter-defined";
import { ElectronUtils } from "../util/electron-utils";
import { ObservableUtils } from "../util/observable-utils";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";
import { AppProfile } from "../models/app-profile";
import { AppActions, AppState } from "../state";
import { AppData } from "../models/app-data";
import { ActiveProfileActions } from "../state/active-profile/active-profile.actions";
import { ModProfileRef } from "../models/mod-profile-ref";
import { OverlayHelpers, OverlayHelpersComponentRef } from "./overlay-helpers";
import { AppProfileSettingsModal } from "../modals/profile-settings";
import { AppDialogs } from "../services/app-dialogs";
import { filterTrue } from "../core/operators";

@Injectable({ providedIn: "root" })
export class ProfileManager {

    @Select(AppState)
    public readonly appState$!: Observable<AppData>;

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    @Select(AppState.isModsActivated)
    public readonly isModsActivated$!: Observable<boolean>;

    constructor(
        messageHandler: AppMessageHandler,
        @Inject(forwardRef(() => Store)) private readonly store: Store,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogs: AppDialogs,
        private readonly snackbar: MatSnackBar
    ) {
        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:addMod"),
            switchMap(() => this.addModFromUser())
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:settings"),
            switchMap(() => this.showProfileSettings())
        ).subscribe();
        
        // Wait for NGXS to load
        of(true).pipe(delay(0)).subscribe(() => {
            // Load app settings from disk
            this.loadSettings();

            // Save app settings to disk on changes
            this.appState$.pipe(
                filterDefined(),
                switchMap(() => this.saveSettings())
            ).subscribe();

            // Save profile settings to disk on changes
            this.activeProfile$.pipe(
                filterDefined(),
                switchMap(profile => this.saveProfile(profile))
            ).subscribe();

            // Deploy/undeploy mods when activated/deactivated
            combineLatest([
                this.activeProfile$,
                this.isModsActivated$,
            ]).pipe(
                filter(([activeProfile]) => !!activeProfile),
                skip(1),
                distinctUntilChanged((a, b) => _.isEqual(a, b)),
                switchMap(([, activated]) => {
                    if (activated) {
                        return this.deployActiveMods();
                    } else {
                        return this.undeployMods();
                    }
                })
            ).subscribe();
        });
    }

    public loadSettings(): Observable<AppData> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppSettingsUserCfg | null>("app:loadSettings").pipe(
            switchMap((settings) => {
                return this.store.dispatch(new AppActions.SetProfiles(settings?.profiles)).pipe(
                    switchMap(() => {
                        if (settings?.activeProfile) {
                            return this.loadProfile(settings.activeProfile, true);
                        } else {
                            this.saveSettings();
                            return this.createProfileFromUser();
                        }
                    }),
                    switchMap(() => this.activateMods(settings?.modsActivated))
                )
            }),
            switchMap(() => this.appState$.pipe(take(1)))
        ));
    }

    public saveSettings(): Observable<void> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            map(appState => this.appDataToUserCfg(appState)),
            switchMap(settings => ElectronUtils.invoke("app:saveSettings", { settings }))
        ));
    }

    public activateMods(activate: boolean = true): Observable<void> {
        return ObservableUtils.hotResult$(this.verifyActiveProfile({ showSuccessMessage: false }).pipe(
            filterTrue(),
            switchMap(() => this.store.dispatch(new AppActions.activateMods(activate)))
        ));
    }

    public reactivateMods(): Observable<any> {
        return concat([
            this.activateMods(false),
            this.activateMods(true),
        ]).pipe(
            toArray()
        );
    }

    public loadProfile(profileName: string, setActive: boolean = true): Observable<AppProfile> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppProfile>("app:loadProfile", { name: profileName }).pipe(
            switchMap((profile) => {
                if (!profile) {
                    // TODO - Show error
                    return this.createProfileFromUser();
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
            ElectronUtils.invoke("app:saveProfile", { profile })
        );
    }

    public verifyActiveProfile(options: {
        showSuccessMessage?: boolean;
        showErrorMessage?: boolean;
    } = { showErrorMessage: true, showSuccessMessage: true }): Observable<boolean> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            filterDefined(),
            switchMap((profile) => ElectronUtils.invoke<AppProfile.VerificationResults>("app:verifyProfile", { profile })),
            switchMap((verificationResults) => from(Object.entries(verificationResults))),
            mergeScan((lastResult, [profileCategory, verificationResults]) => {
                switch (profileCategory) {
                    // Update the error status of each mod (i.e. mod files not found)
                    case "mods": return forkJoin(Object.entries(verificationResults).map(([modName, verificationResult]) => {
                        return this.updateModVerification(modName, verificationResult).pipe(
                            mergeMap(() => this.verifyProfileVerificationResult(verificationResult))
                        )
                    })).pipe(map(results => results.every(Boolean) && lastResult));

                    // TODO - Track error status of other profile state

                    default: return this.verifyProfileVerificationResult(verificationResults).pipe(
                        map(result => result && lastResult)
                    );
                }
            }, true),
            tap((result) => {
                if (result && options.showSuccessMessage) {
                    this.snackbar.open("Mods verified successfully!", undefined, {
                        duration: 3000
                    });
                } else if (options.showErrorMessage) {
                    this.snackbar.open("Mod verification failed with errors", "Close", {
                        panelClass: "snackbar-error"
                    });
                }
            })
        ));
    }

    private verifyProfileVerificationResult(verificationResult: AppProfile.VerificationResult): Observable<boolean> {
        return of(!verificationResult.error);
    }

    public updateModVerification(modName: string, verificationResult: AppProfile.ModVerificationResult): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerification(modName, verificationResult));
    }

    public addProfile(profile: AppProfile): Observable<any> {
        return this.store.dispatch(new AppActions.AddProfile(profile));
    }

    public createProfile(profileName: string, setActive: boolean = true): Observable<AppProfile> {
        const profile = AppProfile.create(profileName);

        if (setActive) {
            this.setActiveProfile(profile);
        }

        this.addProfile(profile);

        return this.saveProfile(profile);
    }

    public createProfileFromUser(): Observable<AppProfile> {
        return ObservableUtils.hotResult$(this.showNewProfileWizard());
    }

    public setActiveProfile(profile: AppProfile | string): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                // Undeploy the mods of the previous profile before switching
                return !!activeProfile ? this.undeployMods() : of(true);
            }),
            switchMap(() => {
                if (typeof profile === "string") {
                    return this.loadProfile(profile, true);
                } else {
                    return this.store.dispatch(new AppActions.updateActiveProfile(profile));
                }
            })
        ));
    }

    public updateActiveProfile(profileChanges: AppProfile): Observable<any> {
        return this.store.dispatch(new AppActions.updateActiveProfile(profileChanges));
    }

    public showProfileSettings(): Observable<OverlayHelpersComponentRef<AppProfileSettingsModal>> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            map((activeProfile) => {
                const modContextMenuRef = this.overlayHelpers.createFullScreen(AppProfileSettingsModal, {
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    minWidth: "24rem",
                    width: "40%",
                    height: "75%",
                    panelClass: "mat-app-background"
                });

                modContextMenuRef.component.instance.profile = activeProfile;
                return modContextMenuRef;
            })
        ));
    }

    public showNewProfileWizard(): Observable<AppProfile> {
        return ObservableUtils.hotResult$(this.showProfileSettings().pipe(
            switchMap((overlayRef) => {
                overlayRef.component.instance.profile = AppProfile.create("New Profile");
                overlayRef.component.instance.createMode = true;
                overlayRef.component.changeDetectorRef.detectChanges();

                return overlayRef.component.instance.onFormSubmit$.pipe(
                    map(() => overlayRef.component.instance.profileSettingsComponent.formModel),
                    switchMap(() => this.setActiveProfile(overlayRef.component.instance.profileSettingsComponent.formModel)),
                );
            })
        ));
    }

    public addModFromUser(): Observable<ModProfileRef> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => ElectronUtils.invoke("profile:addMod", { profile: activeProfile })),
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

    public deleteMod(modName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => forkJoin([
                this.store.dispatch(new ActiveProfileActions.DeleteMod(modName)),
                ElectronUtils.invoke("profile:deleteMod", { profile: activeProfile, modName })
            ]))
        ));
    }

    public renameMod(modCurName: string, modNewName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => concat([
                ElectronUtils.invoke("profile:renameMod", { profile: activeProfile, modCurName, modNewName }),
                this.store.dispatch(new ActiveProfileActions.RenameMod(modCurName, modNewName))
            ]).pipe(toArray()))
        ));
    }

    public renameModFromUser(modCurName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.dialogs.showModRenameDialog(modCurName).pipe(
            filterDefined(),
            switchMap((modNewName) => this.renameMod(modCurName, modNewName))
        ));
    }

    public reorderMods(modOrder: string[]): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.ReorderMods(modOrder));
    }

    public showModInFileExplorer(modName: string): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showModInFileExplorer", { profile, modName })
        )));
    }

    public showProfileBaseDirInFileExplorer(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileBaseDirInFileExplorer", { profile })
        )));
    }

    public showProfileModsDirInFileExplorer(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileModsDirInFileExplorer", { profile })
        )));
    }

    public showModBaseDirInFileExplorer(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showModBaseDirInFileExplorer", { profile })
        )));
    }

    public showGameBaseDirInFileExplorer(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showGameBaseDirInFileExplorer", { profile })
        )));
    }

    public launchGame(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:launchGame", { profile })
        )));
    }

    private deployActiveMods(): Observable<any> {
        return ObservableUtils.hotResult$(this.verifyActiveProfile({ showSuccessMessage: false }).pipe(
            filterTrue(),
            switchMap(() => this.activeProfile$),
            take(1),
            switchMap((activeProfile) => ElectronUtils.invoke("profile:deploy", { profile: activeProfile }))
        ));
    }

    private undeployMods(): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => ElectronUtils.invoke("profile:undeploy", { profile: activeProfile }))
        ));
    }

    private appDataToUserCfg(appData: AppData): AppSettingsUserCfg {
        return {
            profiles: appData.profileNames,
            activeProfile: appData.activeProfile?.name,
            modsActivated: appData.modsActivated
        };
    }
}