import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, InjectionToken, Optional, Output } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";

import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponentModule } from "../../components/dialog-actions/dialog-actions.module";

export const MOD_CUR_NAME_TOKEN = new InjectionToken<string>("MOD_CUR_NAME");

@Component({
    templateUrl: "./mod-rename-dialog.component.html",
    styleUrls: ["./mod-rename-dialog.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModRenameDialog)
    ],
    imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    AppDialogActionsComponentModule
]
})
export class AppModRenameDialog extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(MOD_CUR_NAME_TOKEN) @Optional() public modName: string = ""
    ) {
        super({ cdRef });
    }
}
