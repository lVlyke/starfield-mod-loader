import _ from "lodash";
import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { EMPTY, Observable, of, throwError } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, skip, switchMap, take } from "rxjs/operators";
import { AppMessage, AppMessageData } from "../models/app-message";
import { AppActions, AppState } from "../state";
import { AppMessageHandler } from "./app-message-handler";
import { OverlayHelpers, OverlayHelpersComponentRef, OverlayHelpersRef } from "./overlay-helpers";
import { AppProfile } from "../models/app-profile";
import { AppModSyncIndicatorModal, LOADING_MSG_TOKEN } from "../modals/loading-indicator";
import { AppAboutInfoModal, DEPS_INFO_TOKEN } from "../modals/app-about-info";
import { ElectronUtils } from "../util/electron-utils";
import { ExternalFile } from "../models/external-file";
import { ObservableUtils } from "../util/observable-utils";
import { AppData } from "../models/app-data";
import { DialogManager } from "./dialog-manager";
import { filterDefined } from "../core/operators";
import { LangUtils } from "../util/lang-utils";
import { AppSettingsUserCfg } from "../models/app-settings-user-cfg";
import { GameDatabase } from "../models/game-database";
import { AppPreferencesModal } from "../modals/app-preferences";
import { log } from "../util/logger";

@Injectable({ providedIn: "root" })
export class AppStateBehaviorManager {

    private readonly appState$: Observable<AppData>;
    private readonly isDeployInProgress$: Observable<boolean>;

    constructor(
        messageHandler: AppMessageHandler,
        private readonly store: Store,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogManager: DialogManager,
    ) {
        let deployInProgressOverlayRef: OverlayHelpersRef | undefined;

        this.appState$ = store.select(AppState.get);
        this.isDeployInProgress$ = store.select(AppState.isDeployInProgress);

        // Save app settings to disk on changes
        this.appState$.pipe(
            filterDefined(),
            skip(1),
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b)),
            switchMap(() => this.saveSettings().pipe(
                catchError((err) => (log.error("Failed to save app settings: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:showPreferences"),
            switchMap(() => this.showAppPreferences().pipe(
                catchError((err) => (log.error("Failed to show app settings menu: ", err), EMPTY))
            ))
        ).subscribe();

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.ShowAboutInfo => message.id === "app:showAboutInfo")
        ).subscribe(({ data }) => this.showAppAboutInfo(data));

        messageHandler.messages$.pipe(
            filter((message): message is AppMessage.ToggleModListColumn => message.id === "app:toggleModListColumn"),
            switchMap(({ data }) => {
                if (!!data.column) {
                    return this.toggleModListColumn(data.column);
                } else if (data.reset) {
                    return this.resetModListColumns();
                }

                return EMPTY;
            })
        ).subscribe();

        // Show a loading indicator when app is syncing mod files to base deployment dir
        this.isDeployInProgress$.pipe(
            distinctUntilChanged()
        ).subscribe((deployInProgress) => {
            if (deployInProgress && !deployInProgressOverlayRef) {
                deployInProgressOverlayRef = this.showLoadingIndicator("Syncing mods...");

                deployInProgressOverlayRef.onClose$.subscribe(() => deployInProgressOverlayRef = undefined);
            } else if (!!deployInProgressOverlayRef) {
                deployInProgressOverlayRef.close();
            }
        });
    }

    public openFile(path: string): Observable<ExternalFile> {
        return ElectronUtils.invoke<Pick<ExternalFile, "data" | "path" | "mimeType">>("app:openFile", { path }).pipe(
            map((fileSource) => {
                const blob = new Blob([fileSource.data], { type: fileSource.mimeType });
                return {
                    ...fileSource,
                    blob,
                    url: URL.createObjectURL(blob)
                };
            })
        );
    }

    public setPluginsEnabled(pluginsEnabled: boolean): Observable<void> {
        return this.store.dispatch(new AppActions.setPluginsEnabled(pluginsEnabled));
    }

    public showLoadingIndicator(loadingMsg: string): OverlayHelpersRef {
        return this.overlayHelpers.createFullScreen(AppModSyncIndicatorModal, {
            width: "auto",
            height: "auto",
            minHeight: "10%",
            center: true,
            hasBackdrop: true,
            disposeOnBackdropClick: false,
            panelClass: "mat-app-background"
        }, [[LOADING_MSG_TOKEN, loadingMsg]]);
    }

    public toggleModListColumn(column: string): Observable<void> {
        return this.store.dispatch(new AppActions.ToggleModListColumn(column));
    }

    public resetModListColumns(): Observable<void> {
        return this.store.dispatch(new AppActions.ResetModListColumns());
    }

    public loadSettings(): Observable<AppSettingsUserCfg | null> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppSettingsUserCfg | null>("app:loadSettings").pipe(
            switchMap((settings) => {
                const stateActions = [];

                if (settings?.modListColumns !== undefined) {
                    stateActions.push(new AppActions.updateModListColumns(settings.modListColumns));
                }

                if (settings?.pluginsEnabled !== undefined) {
                    stateActions.push(new AppActions.setPluginsEnabled(settings.pluginsEnabled));
                }

                if (settings?.normalizePathCasing !== undefined) {
                    stateActions.push(new AppActions.setNormalizePathCasing(settings.normalizePathCasing));
                }

                if (settings?.verifyProfileOnStart !== undefined) {
                    stateActions.push(new AppActions.setVerifyProfileOnStart(settings.verifyProfileOnStart));
                }

                if (stateActions.length > 0) {
                    return this.store.dispatch(stateActions).pipe(
                        map(() => settings)
                    );
                } else {
                    return of(settings);
                }
            })
        ));
    }

    public loadProfileList(): Observable<AppProfile.Description[]> {
        return ObservableUtils.hotResult$(ElectronUtils.invoke<AppProfile.Description[]>("app:loadProfileList").pipe(
            switchMap((profileList) => this.store.dispatch(new AppActions.SetProfiles(profileList)).pipe(
                map(() => profileList)
            ))
        ));
    }

    public saveSettings(): Observable<void> {
        return ObservableUtils.hotResult$(this.appState$.pipe(
            take(1),
            map(appState => this.appDataToUserCfg(appState)),
            switchMap(settings => ElectronUtils.invoke("app:saveSettings", { settings })),
            switchMap(() => this.syncUiState())
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
                    return this.store.dispatch(new AppActions.updateGameDb(gameDb)).pipe(
                        map(() => gameDb)
                    );
                } else {
                    const errorText = "Unable to open game database file.";
                    this.dialogManager.createDefault(errorText, [DialogManager.OK_ACTION_PRIMARY]).subscribe();
                    return throwError(() => errorText);
                }
            })
        ));
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

    public showAppAboutInfo(aboutData: AppMessageData<"app:showAboutInfo">): void {
        this.overlayHelpers.createFullScreen(AppAboutInfoModal, {
            width: "50vw",
            height: "auto",
            maxHeight: "75vh",
            center: true,
            hasBackdrop: true,
            disposeOnBackdropClick: true,
            panelClass: "mat-app-background"
        }, [[DEPS_INFO_TOKEN, aboutData]]);
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

    private appDataToUserCfg(appData: AppData): AppSettingsUserCfg {
        return {
            activeProfile: _.pick(appData.activeProfile ?? {}, "name", "gameId") as AppProfile.Description,
            pluginsEnabled: appData.pluginsEnabled,
            normalizePathCasing: appData.normalizePathCasing,
            modListColumns: appData.modListColumns,
            verifyProfileOnStart: appData.verifyProfileOnStart
        };
    }
}