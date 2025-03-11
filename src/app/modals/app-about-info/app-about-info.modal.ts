import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, InjectionToken } from "@angular/core";
import { DatePipe, KeyValuePipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { AppMessageData } from "../../models/app-message";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";
import { AppExternalUrlComponent } from "../../components/external-url";

export const DEPS_INFO_TOKEN = new InjectionToken<AppMessageData<"app:showAboutInfo">>("DEPS_INFO_TOKEN");

@Component({
    selector: "app-about-info-modal",
    templateUrl: "./app-about-info.modal.html",
    styleUrls: ["./app-about-info.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DatePipe,
        KeyValuePipe,

        MatCardModule,
        MatButtonModule,

        AppExternalUrlComponent
    ],
    providers: [ComponentState.create(AppAboutInfoModal)]
})
export class AppAboutInfoModal extends BaseComponent {

    protected readonly today = new Date();
    
    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DEPS_INFO_TOKEN) protected readonly aboutData: AppMessageData<"app:showAboutInfo">,
        @Inject(OverlayRefSymbol) protected readonly overlayRef: OverlayHelpersRef,
    ) {
        super({ cdRef });
    }
}
