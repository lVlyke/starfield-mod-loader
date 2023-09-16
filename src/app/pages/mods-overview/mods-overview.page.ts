import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ComponentState, AsyncState, DeclareState } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { CdkPortal } from "@angular/cdk/portal";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { Observable } from "rxjs";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";

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

    @AsyncState()
    public readonly profileNames!: AppProfile[];

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AsyncState()
    public readonly isModsActivated!: boolean;

    @ViewChild("addModMenu", { read: CdkPortal })
    protected readonly addModMenuPortal!: CdkPortal;

    @DeclareState()
    protected addModMenuRef?: OverlayHelpersRef;

    constructor(
        cdRef: ChangeDetectorRef,
        protected readonly profileManager: ProfileManager,
        protected readonly overlayHelpers: OverlayHelpers
    ) {
        super({ cdRef });
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
            OverlayHelpers.ConnectionPositions.contextMenu, {
                managed: false,
                maxHeight: "20vh"
            }
        );
    }
}
