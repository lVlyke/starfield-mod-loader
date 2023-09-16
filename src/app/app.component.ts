import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { AsyncState, ComponentState } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { BaseComponent } from "./core/base-component";
import { AppState } from "./state";
import { OverlayHelpers, OverlayHelpersRef } from "./services/overlay-helpers";
import { AppModSyncIndicatorModal } from "./modals/mod-sync-indicator";
import { AppTheme } from "./models/app-theme";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppComponent)]
})
export class AppComponent extends BaseComponent {

    @Select(AppState.isDeployInProgress)
    public readonly isDeployInProgress$!: Observable<boolean>;

    @Select(AppState.getTheme)
    public readonly theme$!: Observable<AppTheme>;

    @AsyncState()
    public readonly theme!: AppTheme;

    constructor (
        cdRef: ChangeDetectorRef,
        overlay: OverlayHelpers
    ) {
        super({ cdRef });

        let deployInProgressOverlayRef: OverlayHelpersRef | undefined;

        // Show a loading indicator when app is syncing mod files to base deployment dir
        this.isDeployInProgress$.subscribe((deployInProgress) => {
            if (deployInProgress && !deployInProgressOverlayRef) {
                deployInProgressOverlayRef = overlay.createFullScreen(AppModSyncIndicatorModal, {
                    width: "auto",
                    height: "auto",
                    minHeight: "10%",
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    panelClass: "mat-app-background"
                });
            } else if (!!deployInProgressOverlayRef) {
                deployInProgressOverlayRef.close().subscribe(() => deployInProgressOverlayRef = undefined);
            }
        });
    }
}
