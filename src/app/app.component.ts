import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { AsyncState, ComponentState } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, filter } from "rxjs/operators";
import { BaseComponent } from "./core/base-component";
import { AppState } from "./state";
import { OverlayHelpers, OverlayHelpersRef } from "./services/overlay-helpers";
import { AppModSyncIndicatorModal } from "./modals/mod-sync-indicator";
import { AppAboutInfoModal, DEPS_INFO_TOKEN } from "./modals/app-about-info";
import { AppTheme } from "./models/app-theme";
import { AppMessageHandler } from "./services/app-message-handler";
import { AppMessageData } from "./models/app-message";

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
        messageHandler: AppMessageHandler,
        private readonly overlayHelpers: OverlayHelpers
    ) {
        super({ cdRef });

        let deployInProgressOverlayRef: OverlayHelpersRef | undefined;

        messageHandler.messages$.pipe(
            filter(message => message.id === "app:showAboutInfo")
        ).subscribe(({ data }) => this.showAppAboutInfo(
            data as AppMessageData<"app:showAboutInfo"> // TODO
        ));

        // Show a loading indicator when app is syncing mod files to base deployment dir
        this.isDeployInProgress$.pipe(
            distinctUntilChanged()
        ).subscribe((deployInProgress) => {
            if (deployInProgress && !deployInProgressOverlayRef) {
                deployInProgressOverlayRef = overlayHelpers.createFullScreen(AppModSyncIndicatorModal, {
                    width: "auto",
                    height: "auto",
                    minHeight: "10%",
                    center: true,
                    hasBackdrop: true,
                    disposeOnBackdropClick: false,
                    panelClass: "mat-app-background"
                });

                deployInProgressOverlayRef.onClose$.subscribe(() => deployInProgressOverlayRef = undefined);
            } else if (!!deployInProgressOverlayRef) {
                deployInProgressOverlayRef.close();
            }
        });
    }

    private showAppAboutInfo(aboutData: AppMessageData<"app:showAboutInfo">): void {
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
}
