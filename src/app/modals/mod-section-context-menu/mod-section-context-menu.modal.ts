import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from "@angular/core";

import { MatCardModule } from "@angular/material/card";
import { BasePage } from "../../core/base-page";
import { ComponentState, DeclareState } from "@lithiumjs/angular";
import { OverlayRefSymbol, OverlayHelpersRef } from "../../services/overlay-helpers";
import { AppModSectionActionsComponentModule } from "../../components/mod-section-actions";
import { ModSection } from "../../models/mod-section";

@Component({
    templateUrl: "./mod-section-context-menu.modal.html",
    styleUrls: ["./mod-section-context-menu.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModSectionContextMenuModal)
    ],
    imports: [
        MatCardModule,
        AppModSectionActionsComponentModule
    ]
})
export class AppModSectionContextMenuModal extends BasePage {

    @DeclareState()
    public root!: boolean;

    @DeclareState()
    public section!: ModSection;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });
    }
}
