import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DEFAULT_DIALOG_PROMPT_TOKEN, DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";

@Component({
    templateUrl: "./default-dialog-modal.component.html",
    styleUrls: ["./default-dialog-modal.component.scss"],
    standalone: true,
    imports: [
        CommonModule,

        MatCardModule,
        MatButtonModule,
        MatTooltipModule
    ]
})
export class AppDefaultDialogComponent implements DialogComponent {

    @Output()
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    constructor(
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(DEFAULT_DIALOG_PROMPT_TOKEN) public prompt: string
    ) {}
}
