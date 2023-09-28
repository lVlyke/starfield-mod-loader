import { Injectable } from "@angular/core";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, filter } from "rxjs/operators";
import { AppMessageData } from "../models/app-message";
import { AppState } from "../state";
import { AppMessageHandler } from "./app-message-handler";
import { OverlayHelpers, OverlayHelpersRef } from "./overlay-helpers";
import { AppModSyncIndicatorModal, LOADING_MSG_TOKEN } from "../modals/loading-indicator";
import { AppAboutInfoModal, DEPS_INFO_TOKEN } from "../modals/app-about-info";

@Injectable({ providedIn: "root" })
export class AppStateBehaviorManager {

    @Select(AppState.isDeployInProgress)
    public readonly isDeployInProgress$!: Observable<boolean>;

    constructor(
        messageHandler: AppMessageHandler,
        private readonly overlayHelpers: OverlayHelpers
    ) {
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
                deployInProgressOverlayRef = this.showLoadingIndicator("Syncing mods...");

                deployInProgressOverlayRef.onClose$.subscribe(() => deployInProgressOverlayRef = undefined);
            } else if (!!deployInProgressOverlayRef) {
                deployInProgressOverlayRef.close();
            }
        });
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