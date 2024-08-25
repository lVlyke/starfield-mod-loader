import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { DEFAULT_DIALOG_PROMPT_TOKEN, DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponentModule } from "../../components/dialog-actions/dialog-actions.module";

@Component({
    templateUrl: "./default-dialog-modal.component.html",
    styleUrls: ["./default-dialog-modal.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        AppDialogActionsComponentModule
    ]
})
export class AppDefaultDialogComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    constructor(
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(DEFAULT_DIALOG_PROMPT_TOKEN) public prompt: string
    ) {}
}
