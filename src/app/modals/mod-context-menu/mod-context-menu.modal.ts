import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { BasePage } from "../../core/base-page";
import { ComponentState, DeclareState } from "@lithiumjs/angular";
import { OverlayRefSymbol, OverlayHelpersRef } from "../../services/overlay-helpers";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { AppModActionsComponentModule } from "../../components/mod-actions/mod-actions.module";

@Component({
    templateUrl: "./mod-context-menu.modal.html",
    styleUrls: ["./mod-context-menu.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModContextMenuModal)
    ],
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        AppModActionsComponentModule
    ]
})
export class AppModContextMenuModal extends BasePage {

    @DeclareState()
    public modName!: string;

    @DeclareState()
    public modRef!: ModProfileRef;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });
    }
}
