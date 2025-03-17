import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ComponentState, AsyncState, DeclareState, AfterViewInit, ComponentStateRef, ManagedBehaviorSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { CdkPortal } from "@angular/cdk/portal";
import { MatExpansionPanel } from "@angular/material/expansion";
import { MatSelect } from "@angular/material/select";
import { AbstractControl } from "@angular/forms";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { Observable, combineLatest, of } from "rxjs";
import { delay, distinctUntilChanged, filter, skip, switchMap, tap } from "rxjs/operators";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";
import { DialogManager } from "../../services/dialog-manager";
import { GameDetails } from "../../models/game-details";
import { filterDefined, filterTrue, runOnce } from "../../core/operators";
import { AppDialogs } from "../../services/app-dialogs";
import { ActiveProfileState } from "../../state/active-profile/active-profile.state";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";
import { LangUtils } from "../../util/lang-utils";
import { GameAction } from "../../models/game-action";

@Component({
    selector: "app-mods-overview-page",
    templateUrl: "./mods-overview.page.html",
    styleUrls: ["./mods-overview.page.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppModsOverviewPage)]
})
export class AppModsOverviewPage extends BasePage {

    public readonly profiles$: Observable<AppProfile.Description[]>;
    public readonly activeProfile$: Observable<AppProfile | undefined>;
    public readonly isPluginsEnabled$: Observable<boolean>;
    public readonly isDeployInProgress$: Observable<boolean>;
    public readonly isLogPanelEnabled$: Observable<boolean>;
    public readonly gameDetails$: Observable<GameDetails | undefined>;
    public readonly isProfileDeployed$: Observable<boolean>;
    public readonly isManageConfigFiles$: Observable<boolean>;
    public readonly activeProfilePlugins$: Observable<GamePluginProfileRef[] | undefined>;

    @AsyncState()
    public readonly profiles!: AppProfile.Description[];

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AsyncState()
    public readonly isProfileDeployed!: boolean;

    @AsyncState()
    public readonly isPluginsEnabled!: boolean;

    @AsyncState()
    public readonly gameDetails?: GameDetails;

    @AsyncState()
    public readonly isDeployInProgress!: boolean;

    @AsyncState()
    public readonly isLogPanelEnabled!: boolean;

    @AsyncState()
    public readonly isManageConfigFiles!: boolean;

    @AsyncState()
    public readonly activeProfilePlugins?: GamePluginProfileRef[];

    @ViewChild("currentProfileSelect")
    public readonly currentProfileSelect!: MatSelect;

    @ViewChild("addModMenu", { read: CdkPortal })
    protected readonly addModMenuPortal!: CdkPortal;

    @ViewChild("profileMgmtMenu", { read: CdkPortal })
    protected readonly profileMgmtMenuPortal!: CdkPortal;

    @ViewChild("gameConfigFileMenu", { read: CdkPortal })
    protected readonly gameConfigFileMenuPortal!: CdkPortal;

    @ViewChild("importPluginBackupMenu", { read: CdkPortal })
    protected readonly ImportPluginBackupMenuPortal!: CdkPortal;

    @ViewChild("gameActionsMenu", { read: CdkPortal })
    protected readonly gameActionsMenuPortal!: CdkPortal;

    @ViewChild("profileActionsPanel")
    protected readonly profileActionsPanel!: MatExpansionPanel;

    protected readonly configFileUpdate$ = new ManagedBehaviorSubject<Date>(this, new Date());
    protected readonly profileDescCompareFn = (a: AppProfile.Description, b: AppProfile.Description): boolean => {
        return a.name === b.name && a.gameId === b.gameId;
    };

    @DeclareState()
    protected addModMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected showProfileMgmtMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected gameConfigFileMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected importPluginBackupMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected gameActionsMenuRef?: OverlayHelpersRef;

    @DeclareState("activeDataAction")
    protected _activeDataAction?: AppModsOverviewPage.DataAction;

    protected profileHasPlugins = false;
    protected showedModExternalEditWarning = false;

    @AfterViewInit()
    private readonly afterViewInit$!: Observable<void>;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppModsOverviewPage>,
        store: Store,
        protected readonly profileManager: ProfileManager,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogs: AppDialogs
    ) {
        super({ cdRef });

        this.profiles$ = store.select(AppState.getProfileDescriptions);
        this.activeProfile$ = store.select(AppState.getActiveProfile);
        this.isPluginsEnabled$ = store.select(AppState.isPluginsEnabled);
        this.isDeployInProgress$ = store.select(AppState.isDeployInProgress);
        this.isLogPanelEnabled$ = store.select(AppState.isLogPanelEnabled);
        this.gameDetails$ = store.select(AppState.getActiveGameDetails);
        this.isProfileDeployed$ = store.select(ActiveProfileState.isDeployed);
        this.isManageConfigFiles$ = store.select(ActiveProfileState.isManageConfigFiles);
        this.activeProfilePlugins$ = store.select(ActiveProfileState.getPlugins);

        stateRef.get("currentProfileSelect").pipe(
            filterDefined(),
            switchMap((currentProfileSelect) => currentProfileSelect.openedChange),
            filterTrue(),
        ).subscribe(() => {
            // TODO - Ugly hack to add a backdrop to `mat-select` overlay; not exposed through public API
            (this.currentProfileSelect.panel?.nativeElement as HTMLElement)?.parentElement?.parentElement?.classList.add("backdrop-dark");
        });

        // Pick the default data action on relevant profile changes
        combineLatest(stateRef.getAll(
            "isPluginsEnabled",
            "activeProfilePlugins",
            "isManageConfigFiles"
        )).pipe(
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b))
        ).subscribe(([isPluginsEnabled, activeProfilePlugins, manageConfigFiles]) => {
            this.profileHasPlugins = isPluginsEnabled && !!activeProfilePlugins && activeProfilePlugins.length > 0;

            if (this.profileHasPlugins) {
                this._activeDataAction = "plugins";
            } else if (manageConfigFiles) {
                this._activeDataAction = "config";
            } else {
                this._activeDataAction = undefined;
            }
        });

        // Expand profile actions card if no active data actions are available
        this.afterViewInit$.pipe(
            delay(0),
            switchMap(() => stateRef.get("activeDataAction")),
            skip(1),
            filter(dataAction => !dataAction && !!this.profileActionsPanel),
        ).subscribe(() => this.profileActionsPanel.expanded = true);

        // Confirm with user to re-deploy profile after config file changes
        this.configFileUpdate$.pipe(
            filter(() => this.isProfileDeployed && !this.activeProfile?.configLinkMode),
            switchMap(() => dialogs.showDefault("Config files have been changed or reloaded. Do you want to deploy these changes now?", [
                DialogManager.YES_ACTION_PRIMARY,
                DialogManager.NO_ACTION
            ], DialogManager.POSITIVE_ACTIONS, { disposeOnBackdropClick: true })),
            filterTrue(),
            switchMap(() => profileManager.refreshDeployedMods())
        ).subscribe();
    }

    public get activeDataAction(): AppModsOverviewPage.DataAction | undefined {
        return this._activeDataAction;
    }

    protected registerModUpdate(root: boolean, name: string, mod: ModProfileRef): Observable<void> {
        return this.profileManager.updateMod(root, name, mod);
    }

    protected reorderMods(root: boolean, modOrder: string[]): Observable<void> {
        return this.profileManager.reorderMods(root, modOrder);
    }

    protected updateConfigFile(fileName: string, data: string): Observable<unknown> {
        return runOnce(this.profileManager.updateConfigFile(this.activeProfile!, fileName, data).pipe(
            tap(() => this.configFileUpdate$.next(new Date()))
        ));
    }

    protected reloadConfigFile(fileName: string, control: AbstractControl): Observable<unknown> {
        return runOnce(this.profileManager.readConfigFile(this.activeProfile!, fileName, true).pipe(
            tap(fileData => control.setValue(fileData)),
            tap(() => this.configFileUpdate$.next(new Date()))
        ));
    }

    protected openConfigFile(fileName: string): Observable<unknown> {
        return this.profileManager.openProfileConfigFile(fileName);
    }

    protected toggleExternalPluginManagement(): Observable<void> {
        return this.profileManager.manageExternalPlugins(!this.activeProfile!.manageExternalPlugins);
    }

    protected showProfileModsDirInFileExplorer(): Observable<unknown> {
        let check$: Observable<boolean>;
        if (this.showedModExternalEditWarning || this.activeProfile?.modLinkMode) {
            check$ = of(true);
        } else {
            check$ = this.dialogs.showDefault(
                "If you update any of this profile's mod files externally (i.e. in a text editor) while mods are deployed, make sure to press the Refresh Files button after, otherwise your changes will not be applied.",
                [DialogManager.OK_ACTION_PRIMARY]
            );
        }

        return runOnce(check$.pipe(
            tap(() => this.showedModExternalEditWarning = true),
            filterTrue(),
            switchMap(() => this.profileManager.showProfileModsDirInFileExplorer())
        ));
    }

    protected showAddModMenu($event: MouseEvent): void {
        this.addModMenuRef = this.overlayHelpers.createAttached(this.addModMenuPortal,
            $event.target as HTMLElement,
            OverlayHelpers.ConnectionPositions.contextMenu,
            { managed: false }
        );
    }

    protected showProfileMgmtMenu($event: MouseEvent): void {
        this.showProfileMgmtMenuRef = this.overlayHelpers.createAttached(this.profileMgmtMenuPortal,
            $event.target as HTMLElement,
            OverlayHelpers.ConnectionPositions.contextMenu,
            { managed: false }
        );
    }

    protected showGameConfigFileMenu($event: MouseEvent): void {
        this.gameConfigFileMenuRef = this.overlayHelpers.createAttached(this.gameConfigFileMenuPortal,
            $event.target as HTMLElement,
            OverlayHelpers.ConnectionPositions.contextMenu,
            { managed: false }
        );
    }

    protected showImportPluginBackupMenu($event: MouseEvent): void {
        this.importPluginBackupMenuRef = this.overlayHelpers.createAttached(this.ImportPluginBackupMenuPortal,
            $event.target as HTMLElement,
            [
                OverlayHelpers.fromDefaultConnectionPosition({
                    originX: "end",
                    overlayX: "end"
                }), ...OverlayHelpers.ConnectionPositions.contextMenu
            ],
            {
                managed: false,
                panelClass: "mat-app-background"
            }
        );
    }

    protected showGameActionsMenu($event: MouseEvent): void {
        this.gameActionsMenuRef = this.overlayHelpers.createAttached(this.gameActionsMenuPortal,
            $event.target as HTMLElement,
            [
                OverlayHelpers.fromDefaultConnectionPosition({
                    originX: "end",
                    overlayX: "end"
                }), ...OverlayHelpers.ConnectionPositions.contextMenu
            ],
            {
                managed: false,
                panelClass: "mat-app-background"
            }
        );
    }

    protected showExportPluginBackupMenu(): Observable<unknown> {
        return runOnce(this.dialogs.showProfileBackupNameDialog().pipe(
            filterDefined(),
            switchMap((backupName) => this.profileManager.createProfilePluginBackup(this.activeProfile!, backupName))
        ));
    }

    protected deleteProfilePluginBackup(backupFile: string): Observable<unknown> {
        return runOnce(
            this.profileManager.deleteProfilePluginBackup(this.activeProfile!, backupFile)
        );
    }

    protected exportActiveProfile(): void {
        this.profileManager.exportProfileFromUser(this.activeProfile!);
    }

    protected deleteActiveProfile(): void {
        this.profileManager.deleteProfileFromUser(this.activeProfile!);
    }

    protected addCustomGameAction(): void {
        this.dialogs.showAddCustomGameActionDialog().pipe(
            filterDefined()
        ).subscribe(gameAction => this.profileManager.addCustomGameAction(gameAction));
    }

    protected editCustomGameActionByIndex(index: number, gameAction: GameAction): void {
        this.dialogs.showAddCustomGameActionDialog({ ...gameAction }).pipe(
            filterDefined()
        ).subscribe(gameAction => this.profileManager.editCustomGameActionByIndex(index, gameAction));
    }

    protected removeCustomGameActionByIndex(index: number): void {
        this.dialogs.showDefault("Are you sure you want to delete this action?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filterTrue()
        ).subscribe(() => this.profileManager.removeCustomGameActionByIndex(index));
    }

    protected resolveBackupName(backupEntry: AppProfile.PluginBackupEntry): string {
        return backupEntry.filePath.replace(/\.[^.]+$/g, "");
    }
}

namespace AppModsOverviewPage {
    export type DataAction = "plugins" | "config";
}