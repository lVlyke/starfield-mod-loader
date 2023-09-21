import * as _ from "lodash";
import { Inject, Injectable, forwardRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import { catchError, delay, distinctUntilChanged, filter, map, skip, switchMap, take, tap, toArray } from "rxjs/operators";
import { EMPTY, Observable, combineLatest, concat, forkJoin, merge, of, throwError } from "rxjs";
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
import { LangUtils } from "../util/lang-utils";
import { AppPreferencesModal } from "../modals/app-preferences";
import { AppModImportOptionsModal } from "../modals/mod-import-options";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";
import { ModImportResult, ModImportRequest } from "../models/mod-import-status";

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
            switchMap(() => this.createProfileFromUser().pipe(
                catchError((err) => (console.error("Failed to create new profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:beginModAdd"),
            switchMap(() => this.addModFromUser().pipe(
                catchError((err) => (console.error("Failed to add mod: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:beginModExternalImport"),
            switchMap(() => this.addModFromUser({ externalImport: true }).pipe(
                catchError((err) => (console.error("Failed to import mod: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:settings"),
            switchMap(() => this.showProfileSettings().pipe(
                catchError((err) => (console.error("Failed to show settings menu: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:showPreferences"),
            switchMap(() => this.showAppPreferences().pipe(
                catchError((err) => (console.error("Failed to show app settings menu: ", err), EMPTY))
            ))
        ).subscribe();
        
        // Wait for NGXS to load
        of(true).pipe(delay(0)).subscribe(() => {
            // Load app settings from disk on app start
            this.loadSettings();

            // Save app settings to disk on changes
            this.appState$.pipe(
                filterDefined(),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                switchMap(() => this.saveSettings().pipe(
                    catchError((err) => (console.error("Failed to save app settings: ", err), EMPTY))
                ))
            ).subscribe();

            // Save profile settings to disk on changes
            this.activeProfile$.pipe(
                filterDefined(),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                switchMap((profile) => this.saveProfile(profile).pipe(
                    catchError((err) => (console.error("Failed to save profile: ", err), EMPTY))
                ))
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
                    )),
                    distinctUntilChanged((a, b) => LangUtils.isEqual(a, b))
                ),
                this.isModsActivated$.pipe(
                    distinctUntilChanged()
                ),
            ]).pipe(
                skip(1),
                switchMap(([, activated]) => {
                    if (activated) {
                        return this.deployActiveMods().pipe(
                            catchError((err) => (console.error("Deployment error: ", err), EMPTY))
                        );
                    } else {
                        return this.undeployActiveMods().pipe(
                            catchError((err) => (console.error("Undeployment error: ", err), EMPTY))
                        );
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

    public loadProfile(profileName: string, setActive: boolean = true): Observable<AppProfile | undefined> {
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
        updateManualMods?: boolean;
        mutateState?: boolean;
    } = {}): Observable<boolean> {
        // Provide default options
        options = Object.assign({
            showErrorMessage: true,
            showSuccessMessage: true,
            updateManualMods: true,
            mutateState: true,
        }, options);

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
                        switchMap((verificationResults) => {
                            const modVerificationResults: Record<string, AppProfile.ModVerificationResult> = {};
                            const result = Object.entries(verificationResults).reduce((lastResult, [profileCategory, verificationResults]) => {
                                switch (profileCategory) {
                                    // Update the error status of each mod (i.e. mod files not found)
                                    case "mods": return Object.entries(verificationResults).map(([modName, verificationResult]) => {
                                        modVerificationResults[modName] = verificationResult;

                                        return this.verifyProfileVerificationResult(verificationResult);
                                    }).every(Boolean) && lastResult;
                
                                    // TODO - Track error status of other profile state
                
                                    default: return lastResult && this.verifyProfileVerificationResult(verificationResults);
                                }
                            }, true);

                            if (options.mutateState) {
                                // Update profile mod verification state
                                return this.updateModVerifications(modVerificationResults).pipe(
                                    map(() => result)
                                );
                            } else {
                                return of(result);
                            }
                        }),
                        tap((result) => {
                            if (result && options.showSuccessMessage) {
                                this.snackbar.open("Mods verified successfully!", undefined, {
                                    duration: 3000
                                });
                            } else if (!result && options.showErrorMessage) {
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

    private verifyProfileVerificationResult(verificationResult: AppProfile.VerificationResult): boolean {
        return !verificationResult.error;
    }

    public updateModVerification(modName: string, verificationResult: AppProfile.ModVerificationResult): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerification(modName, verificationResult));
    }

    public updateModVerifications(modVerificationResults: Record<string, AppProfile.ModVerificationResult  | undefined>): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerifications(modVerificationResults));
    }

    public addProfile(profile: AppProfile): Observable<any> {
        return this.store.dispatch(new AppActions.AddProfile(profile));
    }

    public deleteProfile(profile: AppProfile): Observable<any> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke("app:deleteProfile", { profile }).pipe(
            switchMap(() => this.store.dispatch(new AppActions.DeleteProfile(profile))),
            switchMap(() => this.activeProfile$),
            take(1),
            switchMap((activeProfile) => {
                // If the deleted profile was active, switch to the first profile in the list
                // If no other profile exists, show the create profile modal
                if (activeProfile === profile) {
                    return this.appState$.pipe(
                        take(1),
                        switchMap(({ profileNames }) => profileNames.length > 0
                            ? this.setActiveProfile(profileNames[0])
                            : this.createProfileFromUser()
                        )
                    );
                } else {
                    return of(true);
                }
            })
        ));
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

    public createProfileFromUser(defaults?: Partial<AppProfile>): Observable<AppProfile | undefined> {
        return ObservableUtils.hotResult$(this.showNewProfileWizard(defaults));
    }

    public copyProfileFromUser(profileToCopy: AppProfile): Observable<AppProfile | undefined> {
        return ObservableUtils.hotResult$(of(false).pipe(
            switchMap(() => this.showNewProfileWizard({
                ...profileToCopy,
                name: `${profileToCopy.name} - Copy`
            })),
            switchMap((newProfile) => {
                if (!!newProfile) {
                    // Copy mods to the newly created profile
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("app:copyProfileMods", {
                            srcProfile: profileToCopy,
                            destProfile: newProfile
                        })),
                        switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                        map(() => newProfile)
                    );
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public setActiveProfile(profile: AppProfile | string): Observable<AppProfile | undefined> {
        return ObservableUtils.hotResult$(this.isModsActivated$.pipe(
            take(1),
            switchMap((modsActivated) => {
                if (modsActivated) {
                    // Undeploy the mods of the previous profile before switching
                    return this.undeployActiveMods();
                } else {
                    return of(true);
                }
            }),
            switchMap(() => {
                // Make the profile active
                if (typeof profile === "string") {
                    return this.loadProfile(profile, true);
                } else {
                    return this.store.dispatch(new AppActions.updateActiveProfile(profile)).pipe(
                        map(() => profile)
                    );
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

    public showNewProfileWizard(defaults?: Partial<AppProfile>): Observable<AppProfile | undefined> {
        defaults ??= AppProfile.create("New Profile", GameId.STARFIELD); // TODO
        
        return ObservableUtils.hotResult$(this.showProfileSettings().pipe(
            switchMap((overlayRef) => {
                overlayRef.component.instance.profile = defaults as AppProfile;
                overlayRef.component.instance.createMode = true;
                overlayRef.component.changeDetectorRef.detectChanges();

                return overlayRef.component.instance.onFormSubmit$.pipe(
                    map(() => overlayRef.component.instance.profileSettingsComponent.formModel),
                    switchMap(() => this.setActiveProfile(overlayRef.component.instance.profileSettingsComponent.formModel)),
                );
            })
        ));
    }

    public addModFromUser(options?: { externalImport?: boolean }): Observable<ModProfileRef | undefined> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => ElectronUtils.invoke<ModImportRequest | undefined>(
                options?.externalImport ? "profile:beginModExternalImport": "profile:beginModAdd",
                { profile: activeProfile }
            )),
            switchMap((importRequest) => {
                if (!importRequest || importRequest.importStatus === "FAILED") {
                    alert("Failed to add mod."); // TODO - Dialog w/ error
                    return throwError(() => "Failed to add mod.");
                }

                const modImportOptionsRef = this.overlayHelpers.createFullScreen(AppModImportOptionsModal, {
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    minWidth: "24rem",
                    width: "40%",
                    height: "auto",
                    maxHeight: "75%",
                    panelClass: "mat-app-background"
                });

                modImportOptionsRef.component.instance.importRequest = importRequest;
                return merge(
                    modImportOptionsRef.component.instance.onFormSubmit$,
                    modImportOptionsRef.onClose$
                ).pipe(
                    take(1),
                    switchMap((userResult) => {
                        if (!userResult) {
                            importRequest.importStatus = "CANCELED";
                        }

                        return ElectronUtils.invoke<ModImportResult | undefined>("profile:completeModImport", { importRequest }).pipe(
                            switchMap((importResult) => {
                                if (!!importResult) {
                                    return this.store.dispatch(new ActiveProfileActions.AddMod(importResult.modName, importResult.modRef)).pipe(
                                        map(() => importResult.modRef)
                                    );
                                } else {
                                    return of(undefined);
                                }
                            })
                        );
                    })
                );
            })
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

    private deployActiveMods(): Observable<boolean> {
        // First make sure the active profile is verified before deployment
        return ObservableUtils.hotResult$(this.verifyActiveProfile({ showSuccessMessage: false, mutateState: false }).pipe(
            switchMap((verified) => {
                if (verified) {
                    return this.activeProfile$.pipe(
                        take(1),
                        switchMap((activeProfile) => {
                            // Deploy the active profile
                            if (activeProfile) {
                                return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                                    switchMap(() => ElectronUtils.invoke("profile:deploy", { profile: activeProfile })),
                                    delay(0),
                                    switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                                    switchMap(() => this.updateActiveProfileManualMods()), // Update the manual mod list
                                    map(() => true) // Success
                                );
                            } else {
                                return of(false); // Failed
                            }
                        })
                    );
                } else {
                    // Profile couldn't be verified, so verify again with `mutateState` to record the failure
                    return this.verifyActiveProfile({ showSuccessMessage: false, mutateState: true }).pipe(
                        // If re-verify succeeded deploy mods, otherwise notify failure
                        switchMap((result) => result ? this.deployActiveMods() : of(false))
                    );
                }
            })
        ));
    }

    private undeployActiveMods(): Observable<boolean> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                // Undeploy the active profile
                if (activeProfile) {
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("profile:undeploy", { profile: activeProfile })),
                        switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                        switchMap(() => this.updateActiveProfileManualMods()),
                        map(() => true) // Success
                    );
                } else {
                    return of(false); // Failed
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