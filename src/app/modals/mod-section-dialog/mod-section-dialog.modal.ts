import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, InjectionToken, Optional, Output } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponent } from "../../components/dialog-actions";
import { ModSection } from "../../models/mod-section";

export const MOD_SECTION_TOKEN = new InjectionToken<ModSection>("MOD_SECTION");

@Component({
    templateUrl: "./mod-section-dialog.modal.html",
    styleUrls: ["./mod-section-dialog.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,

        AppDialogActionsComponent
    ],
    providers: [
        ComponentState.create(AppModSectionDialog)
    ]
})
export class AppModSectionDialog extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    public modSection: ModSection = AppModSectionDialog.DEFAULT_SECTION();

    protected readonly iconNames: string[] = [
        "list",
        "extension",
        "lightbulb",
        "light_mode",
        "mode_night",
        "thunderstorm",
        "mood",
        "house",
        "music_note",
        "terminal",
        "image",
        "calendar_today",
        "schedule",
        "display_settings",
        "tab"
    ];

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(MOD_SECTION_TOKEN) @Optional() modSection: ModSection | undefined
    ) {
        super({ cdRef });

        this.modSection = modSection ?? this.modSection;
    }

    private static DEFAULT_SECTION(): ModSection {
        return { name: "" };
    }
}
