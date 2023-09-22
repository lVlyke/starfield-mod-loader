import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from "@angular/core";
import { BaseComponent } from "../../core/base-component";
import { ComponentState } from "@lithiumjs/angular";
import { AppProfile } from "../../models/app-profile";
import { OverlayHelpers } from "../../services/overlay-helpers";
import { AppProfileExternalFilesListModal, PROFILE_TOKEN } from "../../modals/profile-external-files-list";

@Component({
    selector: "app-profile-manual-mod-list",
    templateUrl: "./profile-manual-mod-list.component.html",
    styleUrls: ["./profile-manual-mod-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileManualModListComponent),
    ]
})
export class AppProfileManualModListComponent extends BaseComponent {

    @Input()
    public profile!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef,
        private readonly overlayHelpers: OverlayHelpers
    ) {
        super({ cdRef });
    }

    public showFileList(): void {
        this.overlayHelpers.createFullScreen(AppProfileExternalFilesListModal, {
            hasBackdrop: true,
            width: "40vw",
            height: "auto",
            maxHeight: "80vh",
            panelClass: "mat-app-background"
        }, [[PROFILE_TOKEN, this.profile]]);
    }
}
