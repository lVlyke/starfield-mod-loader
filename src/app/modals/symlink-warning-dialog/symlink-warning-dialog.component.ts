import { ChangeDetectionStrategy, Component, EventEmitter, Inject, InjectionToken, Output } from "@angular/core";

import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponentModule } from "../../components/dialog-actions/dialog-actions.module";

@Component({
    templateUrl: "./symlink-warning-dialog.component.html",
    styleUrls: ["./symlink-warning-dialog.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    MatCardModule,
    MatButtonModule,
    AppDialogActionsComponentModule
]
})
export class AppSymlinkWarningDialog implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    constructor(@Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[]) {}
}
