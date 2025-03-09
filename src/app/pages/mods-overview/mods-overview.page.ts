import _ from "lodash";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ComponentState, AsyncState, DeclareState, AfterViewInit, ComponentStateRef } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { CdkPortal } from "@angular/cdk/portal";
import { MatExpansionPanel } from "@angular/material/expansion";
import { MatSelect } from "@angular/material/select";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { EMPTY, Observable, combineLatest, of } from "rxjs";
import { delay, distinctUntilChanged, filter, map, skip, switchMap, tap } from "rxjs/operators";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";
import { DialogManager } from "../../services/dialog-manager";
import { filterDefined, filterTrue, runOnce } from "../../core/operators";
import { AppDialogs } from "../../services/app-dialogs";
import { ActiveProfileState } from "../../state/active-profile/active-profile.state";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";
import { LangUtils } from "../../util/lang-utils";
import { AppProfileSaveListComponent } from "../../components/profile-save-list";

@Component({
    selector: "app-mods-overview-page",
    templateUrl: "./mods-overview.page.html",
    styleUrls: ["./mods-overview.page.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppModsOverviewPage)],
    standalone: false
})
export class AppModsOverviewPage extends BasePage {

    public readonly profiles$: Observable<AppProfile.Description[]>;
    public readonly activeProfile$: Observable<AppProfile | undefined>;
    public readonly isPluginsEnabled$: Observable<boolean>;
    public readonly isLogPanelEnabled$: Observable<boolean>;
    public readonly isProfileDeployed$: Observable<boolean>;
    public readonly isManageConfigFiles$: Observable<boolean>;
    public readonly isManageSaveFiles$: Observable<boolean>;
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
    public readonly isLogPanelEnabled!: boolean;

    @AsyncState()
    public readonly isManageConfigFiles!: boolean;

    @AsyncState()
    public readonly isManageSaveFiles!: boolean;

    @AsyncState()
    public readonly activeProfilePlugins?: GamePluginProfileRef[];

    @ViewChild("currentProfileSelect")
    public readonly currentProfileSelect!: MatSelect;

    @ViewChild("addModMenu", { read: CdkPortal })
    protected readonly addModMenuPortal!: CdkPortal;

    @ViewChild("profileMgmtMenu", { read: CdkPortal })
    protected readonly profileMgmtMenuPortal!: CdkPortal;

    @ViewChild("importPluginBackupMenu", { read: CdkPortal })
    protected readonly ImportPluginBackupMenuPortal!: CdkPortal;

    @ViewChild("profileActionsPanel")
    protected readonly profileActionsPanel!: MatExpansionPanel;

    @ViewChild("profileSavesList", { read: AppProfileSaveListComponent })
    protected readonly profileSavesList?: AppProfileSaveListComponent;

    protected readonly profileDescCompareFn = (a: AppProfile.Description, b: AppProfile.Description): boolean => {
        return a.name === b.name && a.gameId === b.gameId;
    };

    @DeclareState()
    protected addModMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected showProfileMgmtMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected importPluginBackupMenuRef?: OverlayHelpersRef;

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

        this.profiles$ = store.select(AppState.getProfileDescriptions).pipe(
            map(profiles => _.orderBy(profiles, ["gameId", "name"], "asc"))
        );
        this.activeProfile$ = store.select(AppState.getActiveProfile);
        this.isPluginsEnabled$ = store.select(AppState.isPluginsEnabled);
        this.isLogPanelEnabled$ = store.select(AppState.isLogPanelEnabled);
        this.isProfileDeployed$ = store.select(ActiveProfileState.isDeployed);
        this.isManageConfigFiles$ = store.select(ActiveProfileState.isManageConfigFiles);
        this.isManageSaveFiles$ = store.select(ActiveProfileState.isManageSaveFiles);
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
            "isManageConfigFiles",
            "isManageSaveFiles"
        )).pipe(
            distinctUntilChanged((a, b) => LangUtils.isEqual(a, b))
        ).subscribe(([isPluginsEnabled, activeProfilePlugins, manageConfigFiles, manageSaveFiles]) => {
            this.profileHasPlugins = isPluginsEnabled && !!activeProfilePlugins && activeProfilePlugins.length > 0;

            if (this.profileHasPlugins) {
                this._activeDataAction = "plugins";
            } else if (manageConfigFiles) {
                this._activeDataAction = "config";
            } else if (manageSaveFiles) {
                this._activeDataAction = "saves";
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

    protected toggleExternalPluginManagement(): Observable<void> {
        return this.profileManager.manageExternalPlugins(!this.activeProfile!.manageExternalPlugins);
    }

    protected checkConfigRedeployment(): Observable<unknown> {
        if (this.isProfileDeployed && !this.activeProfile?.configLinkMode) {
            return runOnce(this.dialogs.showDefault("Config files have been changed or reloaded. Do you want to deploy these changes now?", [
                DialogManager.YES_ACTION_PRIMARY,
                DialogManager.NO_ACTION
            ], DialogManager.POSITIVE_ACTIONS, { disposeOnBackdropClick: true }).pipe(
                filterTrue(),
                switchMap(() => this.profileManager.refreshDeployedMods())
            ));
        } else {
            return EMPTY;
        }
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

    protected resolveBackupName(backupEntry: AppProfile.PluginBackupEntry): string {
        return backupEntry.filePath.replace(/\.[^.]+$/g, "");
    }
}

namespace AppModsOverviewPage {
    export type DataAction = "plugins" | "config" | "saves";
}