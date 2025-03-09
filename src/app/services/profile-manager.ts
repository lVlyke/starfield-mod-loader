import _ from "lodash";
import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Store } from "@ngxs/store";
import { AppMessageHandler } from "./app-message-handler";
import {
    catchError,
    concatMap,
    distinctUntilChanged,
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
import { filterDefined, filterTrue, runOnce } from "../core/operators";
import { ElectronUtils } from "../util/electron-utils";
import { AppBaseProfile, AppProfile } from "../models/app-profile";
import { AppActions, AppState } from "../state";
import { AppData } from "../models/app-data";
import { ActiveProfileActions } from "../state/active-profile/active-profile.actions";
import { ActiveProfileState } from "../state/active-profile/active-profile.state";
import { ModProfileRef } from "../models/mod-profile-ref";
import { OverlayHelpers } from "./overlay-helpers";
import { AppProfileSettingsModal } from "../modals/profile-settings";
import { AppDialogs } from "../services/app-dialogs";
import { LangUtils } from "../util/lang-utils";
import { AppModImportOptionsModal } from "../modals/mod-import-options";
import { AppModInstallerModal } from "../modals/mod-installer";
import { GameId } from "../models/game-id";
import { ModImportRequest } from "../models/mod-import-status";
import { DialogManager } from "./dialog-manager";
import { DialogAction } from "./dialog-manager.types";
import { AppStateBehaviorManager } from "./app-state-behavior-manager";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { GamePluginProfileRef } from "../models/game-plugin-profile-ref";
import { GameDetails } from "../models/game-details";
import { GameAction } from "../models/game-action";
import { NgForm } from "@angular/forms";
import { ProfileUtils } from "../util/profile-utils";
import { AppMessage } from "../models/app-message";
import { AppProfileVerificationResultsModal } from "../modals/profile-verification-results";
import { log } from "../util/logger";
import { RelativeOrderedMap } from "../util/relative-ordered-map";
import { ModSection } from "../models/mod-section";

@Injectable({ providedIn: "root" })
export class ProfileManager {

    public readonly LAUNCH_GAME_ACTION: GameAction = {
        name: "Start Game",
        actionScript: "${gameBinaryPath}"
    }

    public readonly appState$: Observable<AppData>;
    public readonly activeProfile$: Observable<AppProfile | undefined>;
    public readonly activeGameDetails$: Observable<GameDetails | undefined>;
    public readonly activeGameAction$: Observable<GameAction | undefined>;
    public readonly isPluginsEnabled$: Observable<boolean>;

    constructor(
        messageHandler: AppMessageHandler,
        private readonly store: Store,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogs: AppDialogs,
        private readonly dialogManager: DialogManager,
        private readonly snackbar: MatSnackBar,
        private readonly appManager: AppStateBehaviorManager
    ) {
        this.appState$ = store.select(AppState.get);
        this.activeProfile$ = store.select(AppState.getActiveProfile);
        this.activeGameDetails$ = store.select(AppState.getActiveGameDetails);
        this.activeGameAction$ = store.select(ActiveProfileState.getActiveGameAction);
        this.isPluginsEnabled$ = store.select(AppState.isPluginsEnabled);

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:newProfile"),
            switchMap(() => this.showProfileWizard().pipe(
                catchError((err) => (log.error("Failed to create new profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:importProfile"),
            switchMap(({ data }) => this.importProfileFromUser(data.directImport).pipe(
                catchError((err) => (log.error("Failed to import profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:copyProfile"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([, activeProfile]) => this.copyProfileFromUser(activeProfile!).pipe(
                catchError((err) => (log.error("Failed to copy profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:exportProfile"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([, activeProfile]) => this.exportProfileFromUser(activeProfile!).pipe(
                catchError((err) => (log.error("Failed to export profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:deleteProfile"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([, activeProfile]) => this.deleteProfileFromUser(activeProfile!).pipe(
                catchError((err) => (log.error("Failed to delete profile: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.BeginModAdd => message.id === "profile:beginModAdd"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([{ data }, activeProfile]) => this.addModFromUser(activeProfile!, { root: data?.root }).pipe(
                catchError((err) => (log.error("Failed to add mod: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.BeginModExternalImport => message.id === "profile:beginModExternalImport"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([{ data }, activeProfile]) => this.addModFromUser(activeProfile!, { root: data?.root, externalImport: true }).pipe(
                catchError((err) => (log.error("Failed to import mod: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "profile:settings"),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([, activeProfile]) => this.showProfileWizard(activeProfile).pipe(
                catchError((err) => (log.error("Failed to show settings menu: ", err), EMPTY))
            ))
        ).subscribe();
        
        // Load required data at app start
        forkJoin([
            this.appManager.loadSettings(),
            this.appManager.updateGameDatabase(),
            this.appManager.loadProfileList()
        ]).pipe(
            // Set initial active profile state
            switchMap(([settings, _gameDb, profileList]) => {
                return of(settings?.activeProfile).pipe(
                    // First try loading profile from settings
                    switchMap((profileDesc) => {
                        if (profileDesc && _.size(profileDesc) > 0) {
                            return this.loadProfile(
                                // BC:<=0.6.0: Assume gameId is Starfield if not defined
                                typeof profileDesc === "string"
                                    ? { name: profileDesc, gameId: GameId.STARFIELD, deployed: false }
                                    : profileDesc,
                                true,
                                settings?.verifyProfileOnStart ?? true
                            );
                        }

                        return of(null);
                    }),
                    // Fall back to try loading first profile in list
                    switchMap((profile) => {
                        if (!profile && profileList?.length > 0) {
                            return this.loadProfile(profileList[0]);
                        }

                        return of(profile);
                    }),
                    // Fall back to creating a new profile
                    switchMap((profile) => {
                        if (!profile) {
                            this.appManager.saveSettings();
                            return this.showProfileWizard();
                        }

                        return of(profile);
                    })
                );
            })
        ).subscribe();

        // Save profile settings to disk on changes
        this.activeProfile$.pipe(
            filterDefined(),
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
            switchMap((profile) => this.saveProfile(profile).pipe(
                catchError((err) => (log.error("Failed to save profile: ", err), EMPTY))
            ))
        ).subscribe();

        // Make sure that `manageExternalPlugins` is true if the game requires external plugin management
        this.activeProfile$.pipe(
            filterDefined(),
            map(profile => profile.name),
            distinctUntilChanged(),
            withLatestFrom(this.activeGameDetails$),
            map(([, gameDetails]) => !!gameDetails?.requireExternalPlugins),
            filterTrue(),
            switchMap(() => this.manageExternalPlugins(true))
        ).subscribe();

        // Monitor base profile changes for new/removed mods and update the mod lists
        this.activeProfile$.pipe(
            filterDefined(),
            map(profile => profile.baseProfile),
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
            filterDefined(),
            switchMap(() => this.reconcileActiveModList())
        ).subscribe();

        // Monitor mod changes for new/removed plugins and update the plugins list
        this.activeProfile$.pipe(
            filterDefined(),
            map(profile => _.pick<AppProfile, keyof AppProfile>(profile, "mods", "manageExternalPlugins", "externalFilesCache")),
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
            switchMap(() => this.reconcileActivePluginList())
        ).subscribe();

        // When plugins are enabled, make sure the active profile gets a valid `pluginListPath`
        combineLatest([
            this.isPluginsEnabled$,
            this.activeProfile$
        ]).pipe(
            map(([isPluginsEnabled, activeProfile]) => AppProfile.isFullProfile(activeProfile)
                && isPluginsEnabled
                && !!activeProfile
                && !activeProfile.gamePluginListPath
            ),
            distinctUntilChanged(),
            filterTrue(),
            withLatestFrom(this.activeGameDetails$),
            switchMap(([, activeGameDetails]) => ElectronUtils.invoke("app:verifyPathExists", {
                path: activeGameDetails?.pluginListPaths ?? [],
                dirname: true
            })),
            withLatestFrom(this.activeProfile$),
            switchMap(([pluginListPath, activeProfile]) => {
                if (!!pluginListPath) {
                    return store.dispatch(new ActiveProfileActions.setGamePluginListPath(pluginListPath));
                } else {
                    return this.showProfileWizard(activeProfile, { remedy: "gamePluginListPath" });
                }
            })
        ).subscribe();

        // Handle automatic mod redeployment when the active profile is deployed
        this.activeProfile$.pipe(
            filterDefined(),
            map(profile => _.pick<AppProfile, keyof AppProfile>(profile, "name", "deployed")),
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
            switchMap(() => combineLatest([this.activeProfile$, this.appState$]).pipe(
                filter(([profile]) => !!profile?.deployed),
                map(([profile, appState]) => ([
                    // Monitor these profile properties:
                    _.pick<AppProfile, keyof AppProfile>(profile!,
                        "gameId",
                        "name",
                        "gameRootDir",
                        "gameModDir",
                        "gamePluginListPath",
                        "gameConfigFilePath",
                        "gameSaveFolderPath",
                        "steamGameId",
                        "mods",
                        "rootMods",
                        "plugins",
                        "rootPathOverride",
                        "modsPathOverride",
                        "configPathOverride",
                        "savesPathOverride",
                        "backupsPathOverride",
                        "manageExternalPlugins",
                        "manageConfigFiles",
                        "manageSaveFiles",
                        "manageSteamCompatSymlinks",
                        "modLinkMode",
                        "configLinkMode",
                    ),
    
                    // Monitor these app settings:
                    _.pick<AppData, keyof AppData>(appState,
                        "pluginsEnabled",
                        "normalizePathCasing",
                        "steamCompatDataRoot"
                    )
                ])),
                distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
                skip(1)
            )),
            // Queue update requests for 250ms to avoid back-to-back updates
            throttleTime(250, asyncScheduler, { leading: false, trailing: true }),
            switchMap(() => this.refreshDeployedMods().pipe(
                catchError((err) => (log.error("Mod redeployment error: ", err), EMPTY))
            ))
        ).subscribe();

        // Enable dragging and dropping mods to add/import them
        fromEvent<DragEvent>(document, "drop").pipe(
            filter(event => !!event.dataTransfer?.files.length),
            tap((event) => {
                event.preventDefault();
                event.stopPropagation();
            }),
            withLatestFrom(this.activeProfile$),
            filter(([, activeProfile]) => !!activeProfile),
            switchMap(([event, activeProfile]) => from(event.dataTransfer!.files).pipe(
                concatMap((file) => this.addModFromUser(activeProfile!, {
                    modPath: ElectronUtils.getFilePath(file),
                    externalImport: !file.type && !file.size // `file` is a dir if no type & size
                }).pipe(
                    catchError((err) => (log.error(err), EMPTY))
                ))
            ))
        ).subscribe();

        fromEvent<DragEvent>(document, "dragover").subscribe((event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    public updateActiveModDeployment(deploy: boolean): Observable<any> {
        if (deploy) {
            return this.deployActiveMods();
        } else {
            return this.undeployActiveMods();
        }
    }

    public refreshDeployedMods(): Observable<any> {
        return runOnce(this.undeployActiveMods().pipe(
            switchMap(() => this.deployActiveMods())
        ));
    }

    public loadProfile(profile: AppProfile.Description, setActive: boolean = true, verify: boolean = true): Observable<AppProfile | undefined> {
        return runOnce(ElectronUtils.invoke("app:loadProfile", {
            name: profile.name,
            gameId: profile.gameId
        }).pipe(
            switchMap((profile) => {
                if (profile && setActive) {
                    this.setActiveProfile(profile, verify);
                }

                return of(profile);
            })
        ));
    }

    public saveProfile(profile: AppProfile): Observable<any> {
        return runOnce(ElectronUtils.invoke("app:saveProfile", { profile }));
    }

    public addProfile(profile: AppProfile): Observable<AppProfile> {
        return runOnce(this.saveProfile(profile).pipe(
            switchMap(() => this.store.dispatch(new AppActions.AddProfile(AppProfile.asDescription(profile)))),
            map(() => profile)
        ));
    }

    public reloadBaseProfile(): Observable<AppProfile | undefined> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile?.baseProfile) {
                    return ElectronUtils.invoke("app:loadProfile", {
                        name: activeProfile.baseProfile.name,
                        gameId: activeProfile.baseProfile.gameId
                    });
                } else {
                    return of(undefined);
                }
            }),
            switchMap((baseProfile) => this.store.dispatch(new ActiveProfileActions.setBaseProfile(baseProfile)).pipe(
                map(() => baseProfile)
            ))
        ));
    }

    public resolveProfileFromForm(profile: AppProfile.Form, baseProfile: boolean): Observable<AppProfile> {
        profile = (Object.keys(profile) as Array<keyof AppProfile.Form>).reduce((filteredProfile, profileProp) => {
            const profilePropVal = profile[profileProp];

            if (_.isNil(profilePropVal) || profilePropVal === "") {
                return filteredProfile;
            }

            if (baseProfile && !AppProfile.BASE_PROFILE_KEYS.includes(profileProp as keyof AppBaseProfile)) {
                return filteredProfile;
            }
            
            (filteredProfile as any)[profileProp] = profilePropVal;
            return filteredProfile;
        }, {} as AppProfile.Form);

        if (profile.baseProfile) {
            return ElectronUtils.invoke("app:loadProfile", {
                name: profile.baseProfile,
                gameId: profile.gameId
            }).pipe(
                map((baseProfile) => ({ ...profile, baseProfile }))
            );
        } else {
            return of(_.omit(profile, "baseProfile"));
        }
    }

    public importProfilePluginBackup(profile: AppProfile, backupPath: string): Observable<AppProfile | undefined> {
        return runOnce(ElectronUtils.invoke("profile:importPluginBackup", {
            profile, backupPath
        }).pipe(
            // Reload the profile after restoring the backup
            switchMap((updateProfile) => this.setActiveProfile(updateProfile).pipe(
                // Reconcile data lista
                switchMap(() => this.reconcileDataLists()),
                // Save the profile
                switchMap(() => this.saveProfile(updateProfile))
            ))
        ));
    }

    public createProfilePluginBackup(profile: AppProfile, backupName?: string): Observable<unknown> {
        return runOnce(
            ElectronUtils.invoke("profile:createPluginBackup", { profile, backupName })
        );
    }

    public deleteProfilePluginBackup(profile: AppProfile, backupFile: string): Observable<unknown> {
        return runOnce(
            ElectronUtils.invoke("profile:deletePluginBackup", { profile, backupFile })
        );
    }

    public readPluginBackups(profile: AppProfile): Observable<AppProfile.PluginBackupEntry[]> {
        return ElectronUtils.invoke("profile:readPluginBackups", { profile });
    }

    public exportPluginList(profile: AppProfile): Observable<unknown> {
        return runOnce(
            ElectronUtils.invoke("profile:exportPluginList", { profile })
        );
    }

    public readSaveFiles(profile: AppProfile): Observable<AppProfile.Save[]> {
        return runOnce(
            ElectronUtils.invoke("profile:readSaveFiles", { profile })
        );
    }

    public deleteSaveFile(profile: AppProfile, save: AppProfile.Save): Observable<unknown> {
        return runOnce(
            ElectronUtils.invoke("profile:deleteSaveFile", { profile, save })
        );
    }

    public verifyActiveProfile(options: {
        showSuccessMessage?: boolean;
        showErrorMessage?: boolean;
        reconcileLists?: boolean;
        updateExternalFiles?: boolean;
        updateModErrorState?: boolean;
        updateBaseProfile?: boolean;
    } = {}): Observable<boolean> {
        // Provide default options
        options = Object.assign({
            showErrorMessage: true,
            showSuccessMessage: true,
            reconcileLists: true,
            updateExternalFiles: true,
            updateModErrorState: true,
            updateBaseProfile: true
        }, options);

        const loadingIndicator = this.appManager.showLoadingIndicator("Verifying Profile...");
        let result$ = of<unknown>(true);
        if (options.updateExternalFiles || options.reconcileLists) {
            result$ = forkJoin([result$, this.updateActiveProfileExternalFiles()]);
        }

        if (options.updateBaseProfile || options.reconcileLists) {
            result$ = forkJoin([result$, this.reloadBaseProfile()]);
        }

        if (options.reconcileLists) {
            result$ = result$.pipe(switchMap(() => this.reconcileDataLists()));
        }

        return runOnce(result$.pipe(
            switchMap(() => this.activeProfile$),
            take(1),
            switchMap((profile) => {
                if (profile) {
                    return ElectronUtils.invoke("app:verifyProfile", { profile }).pipe(
                        switchMap((verificationResults) => {
                            let result$ = of(!verificationResults.error);
                            if (options.updateModErrorState) {
                                // Update profile mod verification state
                                result$ = forkJoin([
                                    this.updateModVerifications(false, verificationResults.properties.mods),
                                    this.updateModVerifications(true, verificationResults.properties.rootMods)
                                ]).pipe(
                                    map(() => !verificationResults.error)
                                );
                            }

                            return result$.pipe(
                                tap((result) => {
                                    if ((result && options.showSuccessMessage) || (!result && options.showErrorMessage)) {
                                        this.snackbar.openFromComponent(AppProfileVerificationResultsModal, {
                                            data: verificationResults.properties,
                                            duration: result ? 3000 : undefined
                                        });
                                    } else if (result) {
                                        this.snackbar.dismiss();
                                    }
                                })
                            );
                        })
                    );
                } else {
                    return of(false);
                }
            }),
            finalize(() => loadingIndicator.close())
        ));
    }

    public toggleLockActiveProfile(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((profile) => {
                if (profile) {
                    return this.lockProfile(!profile.locked);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public lockProfile(locked: boolean): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.Lock(locked));
    }

    public findExternalFiles(profile: AppProfile): Observable<AppProfile.ExternalFiles> {
        return ElectronUtils.invoke("profile:findExternalFiles", { profile });
    }

    public updateActiveProfileExternalFiles(): Observable<any> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((profile) => {
                if (profile) {
                    return this.findExternalFiles(profile).pipe(
                        switchMap(externalFiles => this.store.dispatch(new ActiveProfileActions.UpdateExternalFiles(externalFiles)))
                    );
                } else {
                    return of(false);
                }
            })
        ));
    }

    public updateModVerification(root: boolean, modName: string, verificationResult: AppProfile.CollectedVerificationResult): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerification(root, modName, verificationResult));
    }

    public updateModVerifications(root: boolean, modVerificationResults: AppProfile.CollectedVerificationResult): Observable<any> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModVerifications(root, modVerificationResults));
    }

    public exportProfile(profile: AppProfile): Observable<any> {
        return runOnce(ElectronUtils.invoke("app:exportProfile", { profile }).pipe(
            filterDefined(),
            switchMap(() => this.removeProfile(profile))
        ));
    }

    public exportProfileFromUser(profile: AppProfile): Observable<any> {
        return runOnce(this.dialogs.showDefault("Are you sure you want to export this profile?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filterTrue(),
            switchMap(() => this.exportProfile(profile))
        ));
    }

    public deleteProfile(profile: AppProfile): Observable<any> {
        const loadingIndicator = this.appManager.showLoadingIndicator("Deleting Profile...");

        return runOnce(ElectronUtils.invoke("app:deleteProfile", { profile }).pipe(
            switchMap(() => this.removeProfile(profile)),
            tap(() => loadingIndicator.close()),
        ));
    }

    public deleteProfileFromUser(profile: AppProfile): Observable<any> {
        return runOnce(this.dialogs.showDefault("Are you sure you want to delete this profile?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filterTrue(),
            switchMap(() => this.deleteProfile(profile))
        ));
    }

    public importProfileFromUser(directImport: boolean = false): Observable<AppProfile | undefined> {
        // Load the external profile
        return runOnce(ElectronUtils.invoke("app:loadExternalProfile", {}).pipe(
            switchMap((profile) => {
                if (profile) {
                    const profileName = _.last(profile.name.split(/[\\/]/)) ?? "Imported Profile";

                    if (directImport) {
                        // Add the profile directly from its current location
                        return this.addProfile(Object.assign(profile, {
                            rootPathOverride: profile.name,
                            name: profileName
                        })).pipe(switchMap(profile => this.setActiveProfile(profile, true)));
                    } else {
                        // Copy the profile interactively
                        return this.copyProfileFromUser(profile, profileName);
                    }
                } else {
                    return of(undefined);
                }
            }),
            catchError(() => {
                this.dialogManager.createDefault("Failed to import profile. See app.log for more information.", [DialogManager.OK_ACTION]);
                return of(undefined)
            })
        ));
    }

    public copyProfileFromUser(
        profileToCopy: AppProfile,
        profileName: string = `${profileToCopy.name} - Copy`
    ): Observable<AppProfile | undefined> {
        return runOnce(this.showProfileWizard({
            ...profileToCopy,
            name: profileName,
            deployed: false
        }, { createMode: true, verifyProfile: false }).pipe(
            switchMap((newProfile) => {
                if (!!newProfile) {
                    // Copy profile files to the newly created profile if not using the existing folder
                    if (profileToCopy.name !== newProfile.rootPathOverride) {
                        const loadingIndicator = this.appManager.showLoadingIndicator("Copying Profile...");

                        return ElectronUtils.invoke("app:copyProfile", {
                            srcProfile: profileToCopy,
                            destProfile: newProfile
                        }).pipe(
                            tap(() => loadingIndicator.close()),
                            switchMap(() => this.verifyActiveProfile({ showSuccessMessage: false })),
                            map(() => newProfile)
                        );
                    } else {
                        return of(newProfile);
                    }
                } else {
                    return of(undefined);
                }
            }),
            catchError(() => {
                this.dialogManager.createDefault("Failed to copy profile. See app.log for more information.", [DialogManager.OK_ACTION]);
                return of(undefined)
            })
        ));
    }

    public setActiveProfile(profile: AppProfile, verify: boolean = true): Observable<AppProfile> {
        log.info(`Switching to profile ${profile.name}`);

        return runOnce(this.store.dispatch(new AppActions.updateActiveProfile(profile)).pipe(
            verify ? switchMap(() => this.verifyActiveProfile({ showSuccessMessage: false })) : map(() => true),
            map(() => profile)
        ));
    }

    public updateActiveProfile(profileChanges: AppProfile): Observable<any> {
        return this.setActiveProfile(profileChanges);
    }

    public showProfileWizard(
        profile?: Partial<AppProfile>,
        options: {
            createMode?: boolean,
            verifyProfile?: boolean,
            remedy?: boolean | (keyof AppProfile)
        } = { createMode: !profile }
    ): Observable<AppProfile> {
        profile ??= AppProfile.create("New Profile");

        const modContextMenuRef = this.overlayHelpers.createFullScreen(AppProfileSettingsModal, {
            center: true,
            hasBackdrop: true,
            disposeOnBackdropClick: false,
            minWidth: "24rem",
            width: "70%",
            height: "90%",
            panelClass: "mat-app-background"
        });

        if (!!options.remedy) {
            modContextMenuRef.component.instance.remedyMode = options.remedy;
        }

        modContextMenuRef.component.instance.createMode = options.createMode ?? false;
        modContextMenuRef.component.instance.profile = profile;
        modContextMenuRef.component.changeDetectorRef.detectChanges();

        return runOnce(modContextMenuRef.component.instance.onFormSubmit$.pipe(
            switchMap((newProfile) => {
                if (options.createMode) {
                    return this.setActiveProfile(newProfile, options.verifyProfile !== false);
                } else if (options.verifyProfile) {
                    return this.verifyActiveProfile().pipe(map(() => newProfile));
                } else {
                    return of(newProfile);
                }
            })
        ));
    }

    public addModFromUser(profile: AppProfile, options?: {
        externalImport?: boolean;
        modPath?: string;
        root?: boolean;
    }): Observable<ModProfileRef | undefined> {
        const loadingIndicatorRef = this.appManager.showLoadingIndicator("Reading mod data...");

        return runOnce(ElectronUtils.invoke(
            options?.externalImport ? "profile:beginModExternalImport": "profile:beginModAdd",
            { profile, modPath: options?.modPath, root: options?.root }
        ).pipe(
            tap(() => loadingIndicatorRef?.close()),
            switchMap((importRequest) => {
                if (!importRequest) {
                    return of(undefined);
                } else if (importRequest.importStatus === "FAILED") {
                    // TODO - Show error
                    return this.dialogs.showDefault("Failed to add mod.", [
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
            switchMap((importRequest) => {
                if (!importRequest) {
                    return of(undefined);
                }

                const modList = importRequest.root ? profile!.rootMods : profile!.mods;
                const existingMod = RelativeOrderedMap.get(modList, importRequest.modName);

                // Check if this mod already exists in the active profile
                if (!!existingMod && importRequest.importStatus !== "CANCELED") {
                    if (!!existingMod.baseProfile) {
                        return this.dialogManager.createDefault(
                            `"${importRequest.modName}" already exists in base profile "${existingMod.baseProfile}". Please choose a different mod name.`, [
                            DialogManager.OK_ACTION_PRIMARY
                        ]).pipe(
                            map(() => {
                                importRequest.importStatus = "RESTART";
                                return importRequest;
                            })
                        );
                    } else {
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
                            ], { width: "auto", maxWidth: "50vw" }
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
                }

                return of(importRequest);
            }),
            switchMap((importRequest) => {
                if (!importRequest) {
                    return of(undefined);
                }

                if (importRequest.importStatus === "RESTART") {
                    return this.addModFromUser(profile, options);
                } else {
                    const loadingIndicatorRef = this.appManager.showLoadingIndicator("Importing mod data...");

                    // Complete the mod import
                    return ElectronUtils.invoke("profile:completeModImport", { importRequest }).pipe(
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
                }
            })
        ));
    }

    public updateMod(root: boolean, name: string, modRef: ModProfileRef): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.AddMod(root, name, modRef));
    }

    public deleteMod(root: boolean, modName: string): Observable<any> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                const mod = this.findMod(activeProfile!, root, modName);
                const modHasError = mod ? this.modHasError(mod) : false;

                return forkJoin([
                    this.store.dispatch(new ActiveProfileActions.DeleteMod(root, modName)),
                    ElectronUtils.invoke("profile:deleteMod", { profile: activeProfile!, modName })
                ]).pipe(
                    filter(() => modHasError),
                    // Re-verify profile if deleted mod had a verification error
                    switchMap(() => this.verifyActiveProfile({ showSuccessMessage: false }))
                );
            })
        ));
    }

    public renameMod(root: boolean, modCurName: string, modNewName: string): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                const newMod = this.findMod(activeProfile!, root, modNewName);
                if (!!newMod) {
                    return this.dialogManager.createDefault(`Cannot rename mod to "${modNewName}". A mod with this name already exists.`);
                } else {
                    const curMod = this.findMod(activeProfile!, root, modCurName);
                    const modHasError = curMod ? this.modHasError(curMod) : false;

                    return concat([
                        ElectronUtils.invoke("profile:renameMod", { profile: activeProfile!, modCurName, modNewName }),
                        this.store.dispatch(new ActiveProfileActions.RenameMod(root, modCurName, modNewName))
                    ]).pipe(
                        toArray(),
                        filter(() => modHasError),
                        // Re-verify profile if mod had a verification error
                        switchMap(() => this.verifyActiveProfile({ showSuccessMessage: false }))
                    );
                }
            })
        ));
    }

    public renameModFromUser(root: boolean, modCurName: string): Observable<any> {
        return runOnce(this.dialogs.showModRenameDialog(modCurName).pipe(
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
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    const modList = root ? activeProfile.rootMods : activeProfile.mods;
                    const modOrder = RelativeOrderedMap.keys(modList);
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
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                if (activeProfile) {
                    const modList = root ? activeProfile.rootMods : activeProfile.mods;
                    return this.reorderMod(root, modName, modList.length - 1);
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public moveModToSection(root: boolean, modName: string, section: ModSection): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.MoveModToSection(root, modName, section));
    }

    public moveModToTopOfSection(root: boolean, modName: string): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.MoveModToSection(root, modName, undefined, true));
    }

    public moveModToBottomOfSection(root: boolean, modName: string): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.MoveModToSection(root, modName, undefined, false));
    }

    public addModSectionFromUser(root: boolean): Observable<unknown> {
        return this.updateModSectionFromUser(root, undefined);
    }

    public updateModSectionFromUser(root: boolean, section?: ModSection): Observable<unknown> {
        return runOnce(this.dialogs.showAddModSectionDialog(section ? { ...section } : undefined).pipe(
            switchMap((newSection) => {
                if (newSection) {
                    return this.store.dispatch(new ActiveProfileActions.UpdateModSection(root, newSection, section));
                } else {
                    return of(undefined);
                }
            })
        ));
    }

    public reorderModSection(section: ModSection, root: boolean, modIndexBefore?: number): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.ReorderModSection(root, section, modIndexBefore));
    }

    public deleteModSection(root: boolean, section: ModSection): Observable<any> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                const baseSection = activeProfile!.baseProfile
                    ? this.findModSection(activeProfile!.baseProfile, root, section.name)
                    : undefined;

                if (!!baseSection) {
                    return this.dialogManager.createDefault(`Cannot delete mod section "${section.name}". This section is inherited from base profile "${activeProfile!.baseProfile!.name}".`);
                } else {
                    return this.store.dispatch(new ActiveProfileActions.DeleteModSection(root, section));
                }
            })
        ));
    }

    public updateModsInSection(root: boolean, section: ModSection, enabled: boolean): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.UpdateModsInSection(root, section, enabled))
    }

    public readModFilePaths(modName: string, normalizePaths?: boolean): Observable<string[]> {
        return this.activeProfile$.pipe(
            take(1),
            switchMap(activeProfile => ElectronUtils.invoke("profile:readModFilePaths", {
                modName,
                profile: activeProfile!,
                normalizePaths
            }))
        );
    }

    public manageExternalPlugins(manageExternalPlugins: boolean): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.manageExternalPlugins(manageExternalPlugins));
    }

    public updatePlugin(pluginRef: GamePluginProfileRef): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.UpdatePlugin(pluginRef));
    }

    public promotePluginType(pluginRef: GamePluginProfileRef, promotedType: string): Observable<void> {
        if (ProfileUtils.getPluginType(pluginRef) === promotedType) {
            return EMPTY;
        }

        const updatedProfile = ProfileUtils.getDefaultPluginType(pluginRef) === promotedType
            ? { ...pluginRef, promotedType: undefined }
            : { ...pluginRef, promotedType };

        return runOnce(this.updatePlugin(updatedProfile).pipe(
            switchMap(() => this.reconcileActivePluginList())
        ));
    }

    public reorderPlugins(pluginOrder: GamePluginProfileRef[]): Observable<void> {
        return this.store.dispatch(new ActiveProfileActions.UpdatePlugins(pluginOrder));
    }

    public reorderPlugin(plugin: GamePluginProfileRef, newIndex: number): Observable<void> {
        return runOnce(this.activeProfile$.pipe(
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
        return runOnce(this.activeProfile$.pipe(
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

    public readConfigFile(profile: AppProfile, fileName: string, loadDefaults: boolean = false): Observable<string> {
        return ElectronUtils.invoke("profile:readConfigFile", { profile, fileName, loadDefaults });
    }

    public updateConfigFile(fileName: string, data: string): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:updateConfigFile", { profile: profile!, fileName, data }))
        ));
    }

    public isArchiveInvalidationEnabled(): Observable<boolean> {
        return this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:checkArchiveInvalidationEnabled", { profile: profile! }))
        );
    }

    public setArchiveInvalidationEnabled(enabled: boolean): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:setArchiveInvalidationEnabled", { profile: profile!, enabled }))
        ));
    }

    public setActiveGameAction(gameAction: GameAction): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.setActiveGameAction(gameAction));
    }

    public addCustomGameAction(gameAction: GameAction): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.AddCustomGameAction(gameAction));
    }

    public editCustomGameActionByIndex(index: number, gameAction: GameAction): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.EditCustomGameAction(index, gameAction));
    }

    public removeCustomGameActionByIndex(index: number): Observable<unknown> {
        return this.store.dispatch(new ActiveProfileActions.RemoveCustomGameAction(index));
    }

    public runGameAction(gameAction?: GameAction): Observable<unknown> {
        return runOnce(combineLatest([this.activeProfile$, this.activeGameAction$]).pipe(
            take(1),
            switchMap(([activeProfile, activeGameAction]) => {
                const resolvedGameAction = gameAction ?? activeGameAction ?? this.LAUNCH_GAME_ACTION;

                return ElectronUtils.invoke("profile:runGameAction", {
                    profile: activeProfile!,
                    gameAction: resolvedGameAction
                });
            }),
            catchError((error) => {
                this.dialogManager.createDefault(`Failed to run game action: ${error.toString()}`, [DialogManager.OK_ACTION_PRIMARY]);
                return of(undefined);
            })
        ));
    }

    public resolveGameBinaryVersion(): Observable<string | undefined> {
        return this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:resolveGameBinaryVersion", { profile: profile! }))
        );
    }

    public showModInFileExplorer(modName: string, modRef: ModProfileRef): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showModInFileExplorer", { profile: profile!, modName, modRef })
        )));
    }

    public showProfileBaseDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileBaseDirInFileExplorer", { profile: profile! })
        )));
    }

    public showProfileModsDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileModsDirInFileExplorer", { profile: profile! })
        )));
    }

    public showProfileConfigDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileConfigDirInFileExplorer", { profile: profile! })
        )));
    }

    public showProfileSaveDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfileSaveDirInFileExplorer", { profile: profile! })
        )));
    }

    public showGameModDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showGameModDirInFileExplorer", { profile: profile! })
        )));
    }

    public showGameRootDirInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showGameRootDirInFileExplorer", { profile: profile! })
        )));
    }

    public showProfilePluginBackupsInFileExplorer(): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:showProfilePluginBackupsInFileExplorer", { profile: profile! })
        )));
    }

    public openGameConfigFile(configPaths: string[]): Observable<unknown> {
        return runOnce(ElectronUtils.invoke("profile:openGameConfigFile", { configPaths }));
    }
    
    public openProfileConfigFile(configFileName: string): Observable<unknown> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:openProfileConfigFile", { profile: profile!, configFileName })
        )));
    }

    private deployActiveMods(): Observable<boolean> {
        // First make sure the active profile is verified before deployment
        return runOnce(this.verifyActiveProfile({
            showSuccessMessage: false,
            updateModErrorState: false,
            updateExternalFiles: false
        }).pipe(
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
                                            return this.dialogs.showDefault(`Mods for profile "${deployedProfileName}" will be deactivated. Continue?`, [
                                                DialogManager.YES_ACTION_PRIMARY,
                                                DialogManager.NO_ACTION,
                                            ]).pipe(switchMap(userContinue => userContinue ? of(activeProfile) : EMPTY));
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
                                        return this.dialogs.showDefault("Mod deployment failed. Check app.log file for more information.", [
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
                                    switchMap(() => this.appManager.loadProfileList()), // Reload profile descriptions
                                    switchMap(() => this.updateActiveProfileExternalFiles()), // Update the manual mod list
                                    map(() => true) // Success
                                );
                            } else {
                                return of(false); // Failed
                            }
                        })
                    );
                } else {
                    // Profile couldn't be verified, so verify again with `updateModErrorState` to record the failure
                    return this.verifyActiveProfile({ showSuccessMessage: false, updateModErrorState: true }).pipe(
                        // If re-verify succeeded deploy mods, otherwise notify failure
                        switchMap((result) => result ? this.deployActiveMods() : of(false))
                    );
                }
            })
        ));
    }

    private undeployActiveMods(): Observable<boolean> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap((activeProfile) => {
                // Undeploy the active profile if it's deployed
                if (activeProfile?.deployed) {
                    return this.store.dispatch(new AppActions.setDeployInProgress(true)).pipe(
                        switchMap(() => ElectronUtils.invoke("profile:undeploy", { profile: activeProfile })),
                        catchError(() => {
                            // TODO - Show error in dialog
                            return this.dialogs.showDefault("Mod undeployment failed. Check app.log file for more information.", [
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
                        switchMap(() => this.appManager.loadProfileList()), // Reload profile descriptions
                        switchMap(() => this.updateActiveProfileExternalFiles()),
                        map(() => true) // Success
                    );
                } else {
                    return of(false); // Failed
                }
            })
        ));
    }

    public removeProfile(profile: AppProfile): Observable<any> {
        return runOnce(this.store.dispatch(new AppActions.DeleteProfile(AppProfile.asDescription(profile))).pipe(
            switchMap(() => this.activeProfile$),
            take(1),
            switchMap((activeProfile) => {
                // If the deleted profile was active, switch to the first profile in the list
                // If no other profile exists, show the create profile modal
                if (activeProfile === profile) {
                    return this.appState$.pipe(
                        take(1),
                        switchMap(({ profiles }) => {
                            if (profiles.length > 0) {
                                return this.loadProfile(profiles[0], true);
                            } else {
                                return this.showProfileWizard();
                            }
                        })
                    );
                } else {
                    return of(true);
                }
            })
        ));
    }

    private reconcileDataLists(): Observable<void> {
        return runOnce(this.reconcileActiveModList().pipe(
            switchMap(() => this.reconcileActivePluginList())
        ));
    }

    private reconcileActiveModList(): Observable<void> {
        return runOnce(this.findProfileModFiles().pipe(
            switchMap(mods => this.store.dispatch(new ActiveProfileActions.ReconcileModList(mods))),
            switchMap(() => this.store.dispatch(new ActiveProfileActions.ReconcileModSections())),
        ));
    }

    private findProfileModFiles(): Observable<AppProfile.ModList> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:findModFiles", { profile: profile! }))
        ));
    }

    private reconcileActivePluginList(): Observable<void> {
        return runOnce(forkJoin([
            this.findActivePluginFiles(),
            this.activeGameDetails$.pipe(take(1))
        ]).pipe(
            switchMap(([plugins, gameDetails]) => this.store.dispatch(new ActiveProfileActions.ReconcilePluginList(
                plugins,
                gameDetails?.pluginFormats
            )))
        ));
    }

    private findActivePluginFiles(): Observable<GamePluginProfileRef[]> {
        return runOnce(this.activeProfile$.pipe(
            take(1),
            switchMap(profile => ElectronUtils.invoke("profile:findPluginFiles", { profile: profile! }))
        ));
    }

    private findMod(profile: AppBaseProfile, root: boolean, modName: string): ModProfileRef | undefined {
        const modList = root ? profile.rootMods : profile.mods;
        return RelativeOrderedMap.get(modList, modName);
    }

    private findModSection(profile: AppBaseProfile, root: boolean, sectionName: string): ModSection | undefined {
        const sectionList = root ? profile.rootModSections : profile.modSections;
        return _.find(sectionList, { name: sectionName });
    }

    private modHasError(mod: ModProfileRef): boolean {
        return !!mod.verificationError?.error;
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
}