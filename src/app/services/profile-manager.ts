import * as _ from "lodash";
import { Inject, Injectable, forwardRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Select, Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import {
    catchError,
    concatMap,
    delay,
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    finalize,
    map,
    skip,
    switchMap,
    take,
    tap,
    throttleTime,
    toArray,
    withLatestFrom
} from "rxjs/operators";
import { EMPTY, Observable, asyncScheduler, combineLatest, concat, forkJoin, from, fromEvent, merge, of, throwError } from "rxjs";
import { filterDefined } from "../core/operators/filter-defined";
import { ElectronUtils } from "../util/electron-utils";
import { ObservableUtils } from "../util/observable-utils";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";
import { AppProfile } from "../models/app-profile";
import { AppActions, AppState } from "../state";
import { AppData } from "../models/app-data";
import { ActiveProfileActions } from "../state/active-profile/active-profile.actions";
import { ModProfileRef } from "../models/mod-profile-ref";
import { OverlayHelpers, OverlayHelpersComponentRef, OverlayHelpersRef } from "./overlay-helpers";
import { AppProfileSettingsModal } from "../modals/profile-settings";
import { AppDialogs } from "../services/app-dialogs";
import { LangUtils } from "../util/lang-utils";
import { AppPreferencesModal } from "../modals/app-preferences";
import { AppModImportOptionsModal } from "../modals/mod-import-options";
import { AppModInstallerModal } from "../modals/mod-installer";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";
import { ModImportResult, ModImportRequest } from "../models/mod-import-status";
import { DialogManager } from "./dialog-manager";
import { DialogAction } from "./dialog-manager.types";
import { AppStateBehaviorManager } from "./app-state-behavior-manager";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { GamePluginProfileRef } from "../models/game-plugin-profile-ref";
import { filterTrue } from "../core/operators";
import { GameDetails } from "../models/game-details";
import { NgForm } from "@angular/forms";
import { ProfileUtils } from "../util/profile-utils";
import { ActiveProfileState } from "../state/active-profile/active-profile.state";
import { AppMessage } from "../models/app-message";

@Injectable({ providedIn: "root" })
export class ProfileManager {

    @Select(AppState)
    public readonly appState$!: Observable<AppData>;

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    @Select(AppState.getActiveGameDetails)
    public readonly activeGameDetails$!: Observable<GameDetails | undefined>;

    @Select(AppState.isPluginsEnabled)
    public readonly isPluginsEnabled$!: Observable<boolean>;

    @Select(ActiveProfileState.isDeployed)
    public readonly isProfileDeployed$!: Observable<boolean>;

    constructor(
        messageHandler: AppMessageHandler,
        @Inject(forwardRef(() => Store)) private readonly store: Store,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogs: AppDialogs,
        private readonly dialogManager: DialogManager,
        private readonly snackbar: MatSnackBar,
        private readonly appManager: AppStateBehaviorManager
    ) {
        messageHandler.messages$.pipe(
            filter(message => message.id === "app:newProfile"),
            switchMap(() => this.createProfileFromUser().pipe(
                catchError((err) => (console.error("Failed to create new profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.BeginModAdd => message.id === "profile:beginModAdd"),
            switchMap(({ data }) => this.addModFromUser({ root: data?.root }).pipe(
                catchError((err) => (console.error("Failed to add mod: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.BeginModExternalImport => message.id === "profile:beginModExternalImport"),
            switchMap(({ data }) => this.addModFromUser({ root: data?.root, externalImport: true }).pipe(
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

            // Load profile list
            this.loadProfileList();

            // Save app settings to disk on changes
            this.appState$.pipe(
                filterDefined(),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                switchMap(() => forkJoin([
                    this.saveSettings(),
                    this.syncUiState()
                ]).pipe(
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

            // Monitor mod changes for new/removed plugins and update the plugins list
            this.activeProfile$.pipe(
                filterDefined(),
                map(profile => _.pick(profile, "mods")),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                switchMap(() => this.reconcileActivePluginList())
            ).subscribe();

            // When plugins are enabled, make sure the active profile gets a valid `pluginListPath`
            combineLatest([
                this.isPluginsEnabled$,
                this.activeProfile$
            ]).pipe(
                map(([isPluginsEnabled, activeProfile]) => isPluginsEnabled && !!activeProfile && !activeProfile.pluginListPath),
                distinctUntilChanged(),
                filterTrue(),
                withLatestFrom(this.activeGameDetails$),
                switchMap(([, activeGameDetails]) => ElectronUtils.invoke("app:verifyPathExists", {
                    path: activeGameDetails?.pluginListPaths ?? [],
                    dirname: true
                })),
                switchMap((pluginListPath) => {
                    if (!!pluginListPath) {
                        return store.dispatch(new ActiveProfileActions.setPluginListPath(pluginListPath));
                    } else {
                        return this.showProfileSettings({ remedy: "pluginListPath" });
                    }
                })
            ).subscribe();

            // Handle automatic mod redeployment when the active profile is deployed
            this.activeProfile$.pipe(
                filterDefined(),
                distinctUntilKeyChanged("name"),
                switchMap(() => combineLatest([this.activeProfile$, this.appState$]).pipe(
                    filter(([profile]) => !!profile?.deployed),
                    map(([profile, appState]) => ([
                        // Monitor these profile properties:
                        _.pick(profile,
                            "gameId",
                            "name",
                            "modBaseDir",
                            "mods",
                            "rootMods",
                            "plugins"
                        ),
        
                        // Monitor these app settings:
                        _.pick(appState,
                            "pluginsEnabled",
                            "normalizePathCasing"
                        )
                    ])),
                    distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                    skip(1)
                )),
                // Queue update requests for 250ms to avoid back-to-back updates
                throttleTime(250, asyncScheduler, { leading: false, trailing: true }),
                switchMap(() => this.refreshDeployedMods().pipe(
                    catchError((err) => (console.error("Mod redeployment error: ", err), EMPTY))
                ))
            ).subscribe();

            // Enable dragging and dropping mods to add/import them
            fromEvent<DragEvent>(document, "drop").pipe(
                filter(event => !!event.dataTransfer?.files.length),
                tap((event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }),
                switchMap(event => from(event.dataTransfer!.files).pipe(
                    concatMap((file) => this.addModFromUser({
                        modPath: file.path,
                        externalImport: !file.type && !file.size // `file` is a dir if no type & size
                    }).pipe(
                        catchError((err) => (console.error(err), EMPTY))
                    ))
                ))
            ).subscribe();

            fromEvent<DragEvent>(document, "dragover").subscribe((event) => {
                event.preventDefault();
                event.stopPropagation();
            });
        });
    }

    public loadSettings(): Observable<AppData> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppSettingsUserCfg | null>("app:loadSettings").pipe(
            switchMap((settings) => {
                return this.store.dispatch([
                    new AppActions.updateModListColumns(settings?.modListColumns),
                    new AppActions.setPluginsEnabled(settings?.pluginsEnabled ?? false),
                    new AppActions.setNormalizePathCasing(settings?.normalizePathCasing ?? false)
                ]).pipe(
                    switchMap(() => this.updateGameDatabase()),
                    switchMap(() => {
                        if (settings?.activeProfile) {
                            return this.loadProfile(
                                // BC:<=0.6.0: Assume gameId is Starfield if not defined
                                typeof settings.activeProfile === "string"
                                    ? { name: settings.activeProfile, gameId: GameId.STARFIELD, deployed: false }
                                    : settings.activeProfile,
                                true
                            );
                        } else {
                            this.saveSettings();
                            return this.createProfileFromUser();
                        }
                    })
                );
            }),
            switchMap(() => this.appState$.pipe(take(1)))
        ));
    }

    public loadProfileList(): Observable<unknown> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppProfile.Description[]>("app:loadProfileList").pipe(
            switchMap((profileList) => {
                return this.store.dispatch(new AppActions.SetProfiles(profileList));
            })
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
                    const errorText = "Unable to open game database file.";
                    this.dialogManager.createDefault(errorText, [DialogManager.OK_ACTION_PRIMARY]).subscribe();
                    return throwError(() => errorText);
                }
            })
        ));
    }

    public updateActiveModDeployment(deploy: boolean): Observable<any> {
        if (deploy) {
            return this.deployActiveMods();
        } else {
            return this.undeployActiveMods();
        }
    }

    public refreshDeployedMods(): Observable<any> {
        return ObservableUtils.hotResult$(this.undeployActiveMods().pipe(
            switchMap(() => this.deployActiveMods())
        ));
    }

    public loadProfile(profile: AppProfile.Description, setActive: boolean = true): Observable<AppProfile | undefined> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppProfile>("app:loadProfile", {
            name: profile.name,
            gameId: profile.gameId
        }).pipe(
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

    public importProfilePluginBackup(profile: AppProfile, backupPath: string): Observable<AppProfile | undefined> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke("profile:importPluginBackup", {
            profile, backupPath
        }).pipe(
            // Reload the profile after restoring the backup
            switchMap((updateProfile) => this.setActiveProfile(updateProfile).pipe(
                // Reconcile the plugin list
                switchMap(() => this.reconcileActivePluginList()),
                // Save the profile
                switchMap(() => this.saveProfile(updateProfile))
            ))
        ));
    }

    public createProfilePluginBackup(profile: AppProfile, backupName?: string): Observable<void> {
        return ObservableUtils.hotResult$(
            ElectronUtils.invoke("profile:createPluginBackup", { profile, backupName })
        );
    }

    public deleteProfilePluginBackup(profile: AppProfile, backupFile: string): Observable<void> {
        return ObservableUtils.hotResult$(
            ElectronUtils.invoke("profile:deletePluginBackup", { profile, backupFile })
        );
    }

    public readPluginBackups(profile: AppProfile): Observable<AppProfile.PluginBackupEntry[]> {
        return ElectronUtils.invoke("profile:readPluginBackups", { profile });
    }

    public exportPluginList(profile: AppProfile): Observable<unknown> {
        return ObservableUtils.hotResult$(
            ElectronUtils.invoke("profile:exportPluginList", { profile })
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
                            const rootModVerificationResults: Record<string, AppProfile.ModVerificationResult> = {};
                            const result = Object.entries(verificationResults).reduce((lastResult, [profileCategory, verificationResults]) => {
                                switch (profileCategory) {
                                    // Update the error status of each mod (i.e. mod files not found)
                                    case "mods": return Object.entries(verificationResults).map(([modName, verificationResult]) => {
                                        modVerificationResults[modName] = verificationResult;

                                        return this.verifyProfileVerificationResult(verificationResult);
                                    }).every(Boolean) && lastResult;

                                    case "rootMods": return Object.entries(verificationResults).map(([modName, verificationResult]) => {
                                        rootModVerificationResults[modName] = verificationResult;

                                        return this.verifyProfileVerificationResult(verificationResult);
                                    }).every(Boolean) && lastResult;
                
                                    // TODO - Track error status of other profile state
                
                                    default: return lastResult && this.verifyProfileVerificationResult(verificationResults);
                                }
                            }, true);

                            if (options.mutateState) {
                                // Update profile mod verification state
                                return forkJoin([
                                    this.updateModVerifications(false, modVerificationResults),
                                    this.updateModVerifications(true, rootModVerificationResults)
                                ]).pipe(
                                    map(results => results.every(Boolean))
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

    public updateModVerification(root: boolean, modName: string, verificationResult: AppProfile.ModVerificationResult): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerification(root, modName, verificationResult));
    }

    public updateModVerifications(root: boolean, modVerificationResults: Record<string, AppProfile.ModVerificationResult  | undefined>): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerifications(root, modVerificationResults));
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
                        switchMap(({ profiles }) => profiles.length > 0
                            ? this.loadProfile(profiles[0], true)
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

    public setActiveProfile(profile: AppProfile): Observable<AppProfile> {
        return this.store.dispatch(new AppActions.updateActiveProfile(profile)).pipe(
            map(() => profile)
        );
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

    public showProfileSettings(
        options?: { remedy?: boolean | (keyof AppProfile) }
    ): Observable<OverlayHelpersComponentRef<AppProfileSettingsModal>> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            map((activeProfile) => {
                const modContextMenuRef = this.overlayHelpers.createFullScreen(AppProfileSettingsModal, {
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    minWidth: "24rem",
                    width: "70%",
                    height: "90%",
                    panelClass: "mat-app-background"
                });

                if (!!options?.remedy) {
                    modContextMenuRef.component.instance.remedyMode = options.remedy;
                }

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

    public addModFromUser(options?: {
        externalImport?: boolean;
        modPath?: string;
        root?: boolean;
    }): Observable<ModProfileRef | undefined> {
        let loadingIndicatorRef: OverlayHelpersRef | undefined;

        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            tap(() => loadingIndicatorRef = this.appManager.showLoadingIndicator("Reading mod data...")),
            switchMap((activeProfile) => ElectronUtils.invoke<ModImportRequest | undefined>(
                options?.externalImport ? "profile:beginModExternalImport": "profile:beginModAdd",
                { profile: activeProfile, modPath: options?.modPath, root: options?.root }
            )),
            tap(() => loadingIndicatorRef?.close()),
            switchMap((importRequest) => {
                if (!importRequest || importRequest.importStatus === "FAILED") {
                    // TODO - Show error
                    return this.dialogManager.createDefault("Failed to add mod.", [
                        DialogManager.OK_ACTION
                    ]).pipe(
                        switchMap(() => throwError(() => "Failed to add mod."))
                    );
                }

                return (() => {
                    if (importRequest.installer) {
                        // Show the `AppModInstallerModal` to the user
                        return this.createModInstallerModal(importRequest);
                    } else {
                        // Show the `AppModImportOptionsModal` to the user
                        return this.createModImportOptionsModal(importRequest);
                    }
                })().pipe(
                    take(1),
                    switchMap((userResult) => {
                        if (!userResult) {
                            // User canceled, so cancel the import
                            importRequest.importStatus = "CANCELED";
                        }

                        return of(importRequest);
                    })
                );
            }),
            withLatestFrom(this.activeProfile$),
            switchMap(([importRequest, activeProfile]) => {
                const modList = importRequest.root ? activeProfile!.rootMods : activeProfile!.mods;
                const modAlreadyExists = Array.from(modList.keys()).includes(importRequest.modName);

                // Check if this mod already exists in the active profile
                if (modAlreadyExists && importRequest.importStatus !== "CANCELED") {
                    const ACTION_REPLACE: DialogAction = {
                        label: "Replace",
                        accent: true,
                        tooltip: "Removes all existing mod files and replaces them with the new files"
                    };
                    const ACTION_OVERWRITE: DialogAction = {
                        label: "Overwrite",
                        accent: true,
                        tooltip: "Keeps existing mod files and adds new files, overwriting any existing files"
                    };
                    const ACTION_ADD: DialogAction = {
                        label: "Add",
                        accent: true,
                        tooltip: "Keeps existing mod files and only adds new files that do not exist"
                    };

                    // Determine which merge strategy to use
                    return this.dialogManager.createDefault(
                        `"${importRequest.modName}" already exists. Choose a method of resolving file conflicts.`, [
                            ACTION_REPLACE,
                            ACTION_OVERWRITE,
                            ACTION_ADD,
                            DialogManager.CANCEL_ACTION_PRIMARY
                        ], {
                            width: "auto",
                            maxWidth: "50vw",
                            hasBackdrop: true,
                            disposeOnBackdropClick: false
                        }
                    ).pipe(
                        switchMap((result) => {
                            switch (result) {
                                case ACTION_REPLACE: {
                                    importRequest.mergeStrategy = "REPLACE";
                                    break;
                                }
                                case ACTION_OVERWRITE:{
                                    importRequest.mergeStrategy = "OVERWRITE";
                                    break;
                                }
                                case ACTION_ADD:{
                                    importRequest.mergeStrategy = "ADD";
                                    break;
                                }
                                case DialogManager.CANCEL_ACTION_PRIMARY: {
                                    importRequest.importStatus = "CANCELED";
                                    break;
                                }
                            }

                            return of(importRequest);
                        })
                    );
                }

                return of(importRequest);
            }),
            switchMap((importRequest) => {
                const loadingIndicatorRef = this.appManager.showLoadingIndicator("Importing mod data...");

                // Complete the mod import
                return ElectronUtils.invoke<ModImportResult | undefined>("profile:completeModImport", { importRequest }).pipe(
                    switchMap((importResult) => {
                        if (!!importResult) {
                            return this.store.dispatch(new ActiveProfileActions.AddMod(importResult.root, importResult.modName, importResult.modRef)).pipe(
                                map(() => importResult.modRef)
                            );
                        } else {
                            return of(undefined);
                        }
                    }),
                    finalize(() => loadingIndicatorRef.close())
                );
            })
        ));
    }

    public updateMod(root: boolean, name: string, modRef: ModProfileRef): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.AddMod(root, name, modRef));
    }

    public deleteMod(root: boolean, modName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => forkJoin([
                this.store.dispatch(new ActiveProfileActions.DeleteMod(root, modName)),
                ElectronUtils.invoke("profile:deleteMod", { profile: activeProfile, modName })
            ]))
        ));
    }

    public renameMod(root: boolean, modCurName: string, modNewName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => concat([
                ElectronUtils.invoke("profile:renameMod", { profile: activeProfile, modCurName, modNewName }),
                this.store.dispatch(new ActiveProfileActions.RenameMod(root, modCurName, modNewName))
            ]).pipe(toArray()))
        ));
    }

    public renameModFromUser(root: boolean, modCurName: string): Observable<any> {
        return ObservableUtils.hotResult$(this.dialogs.showModRenameDialog(modCurName).pipe(
            switchMap(modNewName => {
                if (modNewName) {
                    return this.renameMod(root, modCurName, modNewName);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public reorderMods(root: boolean, modOrder: string[]): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.ReorderMods(root, modOrder));
    }

    public reorderMod(root: boolean, modName: string, newIndex: number): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    const modList = root ? activeProfile.rootMods : activeProfile.mods;
                    const modOrder = Array.from(modList.keys());
                    moveItemInArray(
                        modOrder,
                        modOrder.findIndex(curModName => modName === curModName),
                        newIndex
                    );
                    return this.reorderMods(root, modOrder);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public moveModToTopOfOrder(root: boolean, modName: string): Observable<void> {
        return this.reorderMod(root, modName, 0);
    }

    public moveModToBottomOfOrder(root: boolean, modName: string): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    const modList = root ? activeProfile.rootMods : activeProfile.mods;
                    return this.reorderMod(root, modName, modList.size - 1);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public readModFilePaths(modName: string, normalizePaths?: boolean): Observable<string[]> {
        return this.activeProfile$.pipe(
            take(1),
            switchMap(activeProfile => ElectronUtils.invoke("profile:readModFilePaths", {
                modName,
                profile: activeProfile,
                normalizePaths
            }))
        );
    }

    public updatePlugin(pluginRef: GamePluginProfileRef): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.UpdatePlugin(pluginRef));
    }

    public reorderPlugins(pluginOrder: GamePluginProfileRef[]): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.UpdatePlugins(pluginOrder));
    }

    public reorderPlugin(plugin: GamePluginProfileRef, newIndex: number): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    const pluginOrder = _.clone(activeProfile.plugins);
                    moveItemInArray(
                        pluginOrder,
                        pluginOrder.findIndex(curPlugin => plugin.plugin === curPlugin.plugin),
                        newIndex
                    );
                    return this.reorderPlugins(pluginOrder);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public movePluginToTopOfOrder(plugin: GamePluginProfileRef): Observable<void> {
        return this.reorderPlugin(plugin, 0);
    }

    public movePluginToBottomOfOrder(plugin: GamePluginProfileRef): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    return this.reorderPlugin(plugin, activeProfile.plugins.length - 1);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public resolvePluginTypeOrderIndex(pluginRef: GamePluginProfileRef): Observable<number> {
        return this.activeGameDetails$.pipe(
            take(1),
            map((gameDetails) => {
                if (gameDetails?.pluginFormats) {
                    return ProfileUtils.getPluginTypeIndex(pluginRef, gameDetails.pluginFormats) ?? 0;
                } else {
                    return 0;
                }
            })
        )
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

    public showProfilePluginBackupsInFileExplorer(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfilePluginBackupsInFileExplorer", { profile })
        )));
    }

    public launchGame(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:launchGame", { profile })
        )));
    }

    public openGameConfigFile(configPaths: string[]): Observable<void> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke("profile:openGameConfigFile", { configPaths }));
    }

    private deployActiveMods(): Observable<boolean> {
        // First make sure the active profile is verified before deployment
        return ObservableUtils.hotResult$(this.verifyActiveProfile({ showSuccessMessage: false, mutateState: false }).pipe(
            switchMap((verified) => {
                if (verified) {
                    return this.activeProfile$.pipe(
                        take(1),
                        withLatestFrom(this.appState$),
                        switchMap(([activeProfile, appState]) => {
                            // Deploy the active profile
                            if (activeProfile) {
                                return ElectronUtils.invoke("profile:findDeployedProfile", { refProfile: activeProfile }).pipe(
                                    switchMap((deployedProfileName) => {
                                        if (deployedProfileName && deployedProfileName !== activeProfile.name) {
                                            return this.dialogManager.createDefault(`Mods for profile "${deployedProfileName}" will be deactivated. Continue?`, [
                                                DialogManager.YES_ACTION_PRIMARY,
                                                DialogManager.NO_ACTION,
                                            ], { hasBackdrop: true }).pipe(
                                                switchMap(result => result === DialogManager.YES_ACTION_PRIMARY
                                                    ? of(activeProfile)
                                                    : EMPTY
                                                )
                                            );
                                        } else {
                                            return of(activeProfile);
                                        }
                                    }),
                                    switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(true))),
                                    switchMap(() => ElectronUtils.invoke("profile:deploy", {
                                        profile: activeProfile,
                                        deployPlugins: appState.pluginsEnabled,
                                        normalizePathCasing: appState.normalizePathCasing
                                    })),
                                    catchError(() => {
                                        // TODO - Show error in dialog
                                        return this.dialogManager.createDefault("Mod deployment failed. Check app.log file for more information.", [
                                            DialogManager.OK_ACTION_PRIMARY
                                        ]).pipe(
                                            switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                                            map(() => false)
                                        );
                                    }),
                                    switchMap(() => this.store.dispatch([
                                        new AppActions.setDeployInProgress(false),
                                        new ActiveProfileActions.setDeployed(true)
                                    ])),
                                    switchMap(() => this.loadProfileList()), // Reload profile descriptions
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
                // Undeploy the active profile if it's deployed
                if (activeProfile?.deployed) {
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("profile:undeploy", { profile: activeProfile })),
                        catchError(() => {
                            // TODO - Show error in dialog
                            return this.dialogManager.createDefault("Mod undeployment failed. Check app.log file for more information.", [
                                DialogManager.OK_ACTION_PRIMARY
                            ]).pipe(
                                switchMap(() => this.store.dispatch(new AppActions.setDeployInProgress(false))),
                                map(() => false)
                            );
                        }),
                        switchMap(() => this.store.dispatch([
                            new AppActions.setDeployInProgress(false),
                            new ActiveProfileActions.setDeployed(false)
                        ])),
                        switchMap(() => this.loadProfileList()), // Reload profile descriptions
                        switchMap(() => this.updateActiveProfileManualMods()),
                        map(() => true) // Success
                    );
                } else {
                    return of(false); // Failed
                }
            })
        ));
    }

    private syncUiState(): Observable<void> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            switchMap((appState) => ElectronUtils.invoke("app:syncUiState", {
                appState,
                modListCols: AppData.DEFAULT_MOD_LIST_COLUMN_ORDER,
                defaultModListCols: AppData.DEFAULT_MOD_LIST_COLUMNS
            }))
        ));
    }

    private reconcileActivePluginList(): Observable<void> {
        return ObservableUtils.hotResult$(this.activeGameDetails$.pipe(
            take(1),
            switchMap((gameDetails) => this.store.dispatch(new ActiveProfileActions.ReconcilePluginList(
                gameDetails?.pluginFormats
            )))
        ))
    }

    private createModImportOptionsModal(importRequest: ModImportRequest): Observable<NgForm | void> {
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

        // Wait for the user to finish making changes
        return merge(
            modImportOptionsRef.component.instance.onFormSubmit$,
            modImportOptionsRef.onClose$
        );
    }

    private createModInstallerModal(importRequest: ModImportRequest): Observable<NgForm | void> {
        const modInstallerRef = this.overlayHelpers.createFullScreen(AppModInstallerModal, {
            center: true,
            hasBackdrop: true,
            disposeOnBackdropClick: false,
            minWidth: "62rem",
            maxWidth: "75%",
            width: "fit-content",
            height: importRequest.installer?.zeroConfig ? "auto" : "80%",
            maxHeight: "80%",
            panelClass: "mat-app-background"
        });

        modInstallerRef.component.instance.importRequest = importRequest;

        // Wait for the user to finish making changes
        return merge(
            modInstallerRef.component.instance.onFormSubmit$,
            modInstallerRef.onClose$
        ).pipe(
            switchMap((userResult) => {
                if (!userResult && importRequest.importStatus === "MANUALINSTALL") {
                    importRequest.importStatus = "PENDING";
                    return this.createModImportOptionsModal(importRequest);
                }

                return of(userResult);
            })
        );
    }

    private appDataToUserCfg(appData: AppData): AppSettingsUserCfg {
        return {
            activeProfile: _.pick(appData.activeProfile ?? {}, "name", "gameId") as AppProfile.Description,
            pluginsEnabled: appData.pluginsEnabled,
            normalizePathCasing: appData.normalizePathCasing,
            modListColumns: appData.modListColumns
        };
    }
}