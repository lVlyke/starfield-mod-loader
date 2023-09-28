import { ChangeDetectorRef, Component, Inject, InjectionToken } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { AppMessageData } from "../../models/app-message";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";

export const DEPS_INFO_TOKEN = new InjectionToken<AppMessageData<"app:showAboutInfo">>("DEPS_INFO_TOKEN");

@Component({
    selector: "app-about-info-modal",
    templateUrl: "./app-about-info.modal.html",
    styleUrls: ["./app-about-info.modal.scss"],
    standalone: true,
    imports: [
        CommonModule,

        MatCardModule,
        MatButtonModule
    ],
    providers: [ComponentState.create(AppAboutInfoModal)]
})
export class AppAboutInfoModal extends BaseComponent {

    public licenses = {};
    
    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DEPS_INFO_TOKEN) public readonly aboutData: AppMessageData<"app:showAboutInfo">,
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
    ) {
        super({ cdRef });
    }
}
