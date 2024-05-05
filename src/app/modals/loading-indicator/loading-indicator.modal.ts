import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, InjectionToken } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { BaseComponent } from "../../core/base-component";

export const LOADING_MSG_TOKEN = new InjectionToken<string>("LOADING_MSG");

@Component({
    templateUrl: "./loading-indicator.modal.html",
    styleUrls: ["./loading-indicator.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        MatCardModule,
        MatIconModule
    ]
})
export class AppModSyncIndicatorModal extends BaseComponent {

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(LOADING_MSG_TOKEN) public readonly loadingMsg: string
    ) {
        super({ cdRef });
    }
}
