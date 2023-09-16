import * as _ from "lodash";
import { Inject, Injectable, forwardRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import { delay, distinctUntilChanged, filter, map, mergeMap, mergeScan, skip, switchMap, take, tap, toArray } from "rxjs/operators";
import { Observable, combineLatest, concat, forkJoin, from, of, throwError } from "rxjs";
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
import { LangUtils } from "../util/lang-utils";
import { AppPreferencesModal } from "../modals/app-preferences";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";

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
            filter(message => message.id === "app:newProfile"),
            switchMap(() => this.createProfileFromUser())
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:addMod"),
            switchMap(() => this.addModFromUser())
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:importMod"),
            switchMap(() => this.addModFromUser({ importMod: true }))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:settings"),
            switchMap(() => this.showProfileSettings())
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:showPreferences"),
            switchMap(() => this.showAppPreferences())
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
                this.activeProfile$.pipe(
                    filterDefined(),
                    // Monitor only the following profile properties for state changes:
                    map(profile => _.pick(profile,
                        "name",
                        "modBaseDir",
                        "mods"
                    ))
                ),
                this.isModsActivated$,
            ]).pipe(
                skip(1),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
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
                    switchMap(() => this.updateGameDatabase()),
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

    public updateSettings(settings: Partial<AppData>): Observable<void> {
        return ObservableUtils.hotResult$(this.store.dispatch(new AppActions.UpdateSettings(settings)).pipe(
            switchMap(() => this.saveSettings())
        ));
    }

    public updateGameDatabase(): Observable<GameDatabase> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<GameDatabase>("app:loadGameDatabase").pipe(
            switchMap((gameDb) => {
                if (!!gameDb) {
                    return this.store.dispatch(new AppActions.updateGameDb(gameDb))
                } else {
                    // TODO
                    return throwError(() => "Unable to open game database.");
                }
            })
        ));
    }

    public activateMods(activate: boolean = true): Observable<void> {
        return ObservableUtils.hotResult$(this.verifyActiveProfile({
            updateManualMods: false,
            showSuccessMessage: false
        }).pipe(
            switchMap((verified) => {
                if (verified) {
                    return this.store.dispatch(new AppActions.activateMods(activate));
                } else {
                    return of(false);
                }
            })
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
        updateManualMods?: boolean
    } = {
        showErrorMessage: true,
        showSuccessMessage: true,
        updateManualMods: true
    }): Observable<boolean> {
        let result$;
        if (options.updateManualMods) {
            result$ = this.updateActiveProfileManualMods();
        } else {
            result$ = of(true);
        }

        return ObservableUtils.hotResult$(result$.pipe(
            switchMap(() => this.activeProfile$),
            take(1),
            switchMap((profile) => {
                if (profile) {
                    return ElectronUtils.invoke<AppProfile.VerificationResults>("app:verifyProfile", { profile }).pipe(
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
                    );
                } else {
                    return of(false);
                }
            })
        ));
    }

    public findManualMods(profile: AppProfile): Observable<string[]> {
        return ElectronUtils.invoke<string[]>("profile:findManualMods", { profile });
    }

    public updateActiveProfileManualMods(): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((profile) => {
                if (profile) {
                    return this.findManualMods(profile).pipe(
                        switchMap(manualMods => this.store.dispatch(new ActiveProfileActions.UpdateManualMods(manualMods)))
                    );
                } else {
                    return of(false);
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

    public createProfile(
        profileName: string,
        gameId: GameId,
        setActive: boolean = true
    ): Observable<AppProfile> {
        const profile = AppProfile.create(profileName, gameId);

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
                if (activeProfile) {
                    // Undeploy the mods of the previous profile before switching
                    return this.undeployMods();
                } else {
                    return of(true);
                }
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

    public showAppPreferences(): Observable<OverlayHelpersComponentRef<AppPreferencesModal>> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            map((preferences) => {
                const modContextMenuRef = this.overlayHelpers.createFullScreen(AppPreferencesModal, {
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    minWidth: "24rem",
                    width: "40%",
                    height: "auto",
                    maxHeight: "75%",
                    panelClass: "mat-app-background"
                });

                modContextMenuRef.component.instance.preferences = preferences;
                return modContextMenuRef;
            })
        ));
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
                overlayRef.component.instance.profile = AppProfile.create("New Profile", GameId.STARFIELD); // TODO
                overlayRef.component.instance.createMode = true;
                overlayRef.component.changeDetectorRef.detectChanges();

                return overlayRef.component.instance.onFormSubmit$.pipe(
                    map(() => overlayRef.component.instance.profileSettingsComponent.formModel),
                    switchMap(() => this.setActiveProfile(overlayRef.component.instance.profileSettingsComponent.formModel)),
                );
            })
        ));
    }

    public addModFromUser(options?: { importMod?: boolean }): Observable<ModProfileRef> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => ElectronUtils.invoke(options?.importMod ? "profile:importMod": "profile:addMod", {
                profile: activeProfile
            })),
            switchMap((result) => {
                if (!result) {
                    alert("Failed to add mod."); // TODO - Dialog w/ error
                    return throwError(() => "Failed to add mod.");
                }

                return of(result);
            }),
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
            switchMap(modNewName => {
                if (modNewName) {
                    return this.renameMod(modCurName, modNewName);
                } else {
                    return of(undefined);
                }
            })
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
            switchMap((activeProfile) => {
                if (activeProfile) {
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("profile:deploy", { profile: activeProfile })),
                        switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                        switchMap(() => this.updateActiveProfileManualMods())
                    );
                } else {
                    return of(false);
                }
            })
        ));
    }

    private undeployMods(): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("profile:undeploy", { profile: activeProfile })),
                        switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                        switchMap(() => this.updateActiveProfileManualMods())
                    );
                } else {
                    return of(false);
                }
            })
            
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