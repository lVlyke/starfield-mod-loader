import { ChangeDetectorRef, Component, Inject, InjectionToken } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { ComponentState } from "@lithiumjs/angular";
import { AppProfile } from "../../models/app-profile";
import { BaseComponent } from "../../core/base-component";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";

export const PROFILE_TOKEN = new InjectionToken<AppProfile>("PROFILE");

@Component({
    selector: "app-profile-external-files-list-modal",
    templateUrl: "./profile-external-files-list.modal.html",
    styleUrls: ["./profile-external-files-list.modal.scss"],
    standalone: true,
    imports: [
        CommonModule,

        MatCardModule,
        MatButtonModule
    ],
    providers: [ComponentState.create(AppProfileExternalFilesListModal)]
})
export class AppProfileExternalFilesListModal extends BaseComponent {
    
    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(PROFILE_TOKEN) public readonly profile: AppProfile,
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
    ) {
        super({ cdRef });
    }
}
