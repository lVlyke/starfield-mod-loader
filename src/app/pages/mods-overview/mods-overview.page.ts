import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ComponentState, AsyncState, DeclareState, AfterViewInit, ComponentStateRef } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { CdkPortal } from "@angular/cdk/portal";
import { MatExpansionPanel } from "@angular/material/expansion";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { Observable, combineLatest } from "rxjs";
import { filter, skip, switchMap } from "rxjs/operators";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";
import { DialogManager } from "../../services/dialog-manager";
import { GameDetails } from "../../models/game-details";
import { filterFalse } from "../../core/operators";

@Component({
    selector: "app-mods-overview-page",
    templateUrl: "./mods-overview.page.html",
    styleUrls: ["./mods-overview.page.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppModsOverviewPage)]
})
export class AppModsOverviewPage extends BasePage {

    @Select(AppState.getProfileNames)
    public readonly profileNames$!: Observable<AppProfile[]>;

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    @Select(AppState.isModsActivated)
    public readonly isModsActivated$!: Observable<boolean>;

    @Select(AppState.isPluginsEnabled)
    public readonly isPluginsEnabled$!: Observable<boolean>;

    @Select(AppState.getActiveGameDetails)
    public readonly gameDetails$!: Observable<GameDetails | undefined>;

    @AsyncState()
    public readonly profileNames!: AppProfile[];

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AsyncState()
    public readonly isModsActivated!: boolean;

    @AsyncState()
    public readonly isPluginsEnabled!: boolean;

    @AsyncState()
    public readonly gameDetails?: GameDetails;

    @ViewChild("addModMenu", { read: CdkPortal })
    protected readonly addModMenuPortal!: CdkPortal;

    @ViewChild("profileMgmtMenu", { read: CdkPortal })
    protected readonly profileMgmtMenuPortal!: CdkPortal;

    @ViewChild("gameConfigFileMenu", { read: CdkPortal })
    protected readonly gameConfigFileMenuPortal!: CdkPortal;

    @ViewChild("profileActionsPanel")
    protected readonly profileActionsPanel!: MatExpansionPanel;

    @DeclareState()
    protected addModMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected showProfileMgmtMenuRef?: OverlayHelpersRef;

    @DeclareState()
    protected gameConfigFileMenuRef?: OverlayHelpersRef;

    @AfterViewInit()
    private readonly afterViewInit$!: Observable<void>;

    protected showPluginList = false;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppModsOverviewPage>,
        protected readonly profileManager: ProfileManager,
        private readonly overlayHelpers: OverlayHelpers,
        private readonly dialogManager: DialogManager
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            switchMap(() => this.isPluginsEnabled$),
            skip(1),
            filterFalse(),
        ).subscribe(() => this.profileActionsPanel.expanded = true);

        combineLatest(stateRef.getAll(
            "isPluginsEnabled",
            "activeProfile"
        )).subscribe(([isPluginsEnabled, activeProfile]) => {
            this.showPluginList = isPluginsEnabled && !!activeProfile && activeProfile.plugins.length > 0;
        });
    }

    protected registerModUpdate(name: string, mod: ModProfileRef): Observable<void> {
        return this.profileManager.updateMod(name, mod);
    }

    protected reorderMods(modOrder: string[]): Observable<void> {
        return this.profileManager.reorderMods(modOrder);
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

    protected deleteActiveProfile(): void {
        this.dialogManager.createDefault("Are you sure you want to delete the current profile?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filter(choice => choice === DialogManager.YES_ACTION)
        ).subscribe(() => this.profileManager.deleteProfile(this.activeProfile!));
    }
}
