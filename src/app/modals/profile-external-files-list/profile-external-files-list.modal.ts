import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, InjectionToken } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";

export const FILE_LIST_TOKEN = new InjectionToken<string[]>("FILE_LIST");

@Component({
    selector: "app-profile-external-files-list-modal",
    templateUrl: "./profile-external-files-list.modal.html",
    styleUrls: ["./profile-external-files-list.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        @Inject(FILE_LIST_TOKEN) public readonly fileList: string[],
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
    ) {
        super({ cdRef });
    }
}
