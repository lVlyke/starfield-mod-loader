import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ComponentState, AsyncState, DeclareState, AfterViewInit, ComponentStateRef } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { CdkPortal } from "@angular/cdk/portal";
import { MatExpansionPanel } from "@angular/material/expansion";
import { MatSelect } from "@angular/material/select";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { Observable, combineLatest, of } from "rxjs";
import { delay, filter, skip, switchMap, tap } from "rxjs/operators";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";
import { DialogManager } from "../../services/dialog-manager";
import { GameDetails } from "../../models/game-details";
import { filterDefined, filterFalse, filterTrue } from "../../core/operators";
import { AppDialogs } from "../../services/app-dialogs";
import { ObservableUtils } from "../../util/observable-utils";
import { DialogAction } from "../../services/dialog-manager.types";
import { ActiveProfileState } from "src/app/state/active-profile/active-profile.state";

@Component({
    selector: "app-mods-overview-page",
    templateUrl: "./mods-overview.page.html",
    styleUrls: ["./mods-overview.page.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppModsOverviewPage)]
})
export class AppModsOverviewPage extends BasePage {

    @Select(AppState.getProfileDescriptions)
    public readonly profiles$!: Observable<AppProfile.Description[]>;

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    @Select(AppState.isPluginsEnabled)
    public readonly isPluginsEnabled$!: Observable<boolean>;

    @Select(AppState.isDeployInProgress)
    public readonly isDeployInProgress$!: Observable<boolean>;

    @Select(AppState.getActiveGameDetails)
    public readonly gameDetails$!: Observable<GameDetails | undefined>;

    @Select(ActiveProfileState.isDeployed)
    public readonly isProfileDeployed$!: Observable<boolean>;

    @AsyncState()
    public readonly profiles!: AppProfile.Description[];

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AsyncState()
    public readonly isProfileDeployed!: boolean;

    @AsyncState()
    public readonly isPluginsEnabled!: boolean;

    @AsyncState()
    public readonly isDeployInProgress!: boolean;

    @AsyncState()
    public readonly gameDetails?: GameDetails;

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

    @ViewChild("profileActionsPanel")
    protected readonly profileActionsPanel!: MatExpansionPanel;

    @DeclareState()
    protected addModMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected showProfileMgmtMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected gameConfigFileMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected importPluginBackupMenuRef?: OverlayHelpersRef;

    @AfterViewInit()
    private readonly afterViewInit$!: Observable<void>;

    protected readonly profileDescCompareFn = (a: AppProfile.Description, b: AppProfile.Description): boolean => {
        return a.name === b.name && a.gameId === b.gameId;
    };

    protected showPluginList = false;
    protected showedModExternalEditWarning = false;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppModsOverviewPage>,
        protected readonly profileManager: ProfileManager,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogManager: DialogManager,
        private readonly dialogs: AppDialogs
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            delay(0),
            switchMap(() => this.isPluginsEnabled$),
            skip(1),
            filterFalse(),
        ).subscribe(() => this.profileActionsPanel.expanded = true);

        stateRef.get("currentProfileSelect").pipe(
            filterDefined(),
            switchMap((currentProfileSelect) => currentProfileSelect.openedChange),
            filterTrue(),
        ).subscribe(() => {
            // TODO - Ugly hack to add a backdrop to `mat-select` overlay; not exposed through public API
            (this.currentProfileSelect.panel?.nativeElement as HTMLElement)?.parentElement?.parentElement?.classList.add("backdrop-dark");
        });

        combineLatest(stateRef.getAll(
            "isPluginsEnabled",
            "activeProfile"
        )).subscribe(([isPluginsEnabled, activeProfile]) => {
            this.showPluginList = isPluginsEnabled && !!activeProfile && activeProfile.plugins.length > 0;

            if (!this.showPluginList && this.profileActionsPanel) {
                this.profileActionsPanel.expanded = true;
            }
        });
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

    protected showProfileModsDirInFileExplorer(): Observable<unknown> {
        let check$: Observable<DialogAction>;
        if (this.showedModExternalEditWarning) {
            check$ = of(DialogManager.OK_ACTION_PRIMARY);
        } else {
            check$ = this.dialogManager.createDefault(
                "If you update any of the profile's mod files externally (i.e. in a text editor) while mods are deployed, make sure to press the Refresh Files button after, otherwise your changes will not be applied.",
                DialogManager.DEFAULT_ACTIONS,
                { hasBackdrop: true }
            );
        }

        return ObservableUtils.hotResult$(check$.pipe(
            tap(() => this.showedModExternalEditWarning = true),
            filter(result => result === DialogManager.OK_ACTION_PRIMARY),
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

    protected showExportPluginBackupMenu(): Observable<unknown> {
        return ObservableUtils.hotResult$(this.dialogs.showProfileBackupNameDialog().pipe(
            filterDefined(),
            switchMap((backupName) => this.profileManager.createProfilePluginBackup(this.activeProfile!, backupName))
        ));
    }

    protected deleteProfilePluginBackup(backupFile: string): Observable<void> {
        return ObservableUtils.hotResult$(
            this.profileManager.deleteProfilePluginBackup(this.activeProfile!, backupFile)
        );
    }

    protected deleteActiveProfile(): void {
        this.dialogManager.createDefault("Are you sure you want to delete the current profile?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ], { hasBackdrop: true, disposeOnBackdropClick: false }).pipe(
            filter(choice => choice === DialogManager.YES_ACTION)
        ).subscribe(() => this.profileManager.deleteProfile(this.activeProfile!));
    }

    protected resolveBackupName(backupEntry: AppProfile.PluginBackupEntry): string {
        return backupEntry.filePath.replace(/\.[^.]+$/g, "");
    }
}
