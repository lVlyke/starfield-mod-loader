import { 
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    InjectionToken,
    Output
} from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";

import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponent } from "../../components/dialog-actions";

export const OLD_PATH_TOKEN = new InjectionToken<string>("OLD_PATH");
export const NEW_PATH_TOKEN = new InjectionToken<string>("NEW_PATH");

@Component({
    templateUrl: "./profile-folder-move-dialog.component.html",
    styleUrls: ["./profile-folder-move-dialog.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        
        MatCardModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,

        AppDialogActionsComponent
    ],
    providers: [
        ComponentState.create(AppProfileFolderMoveDialog)
    ]
})
export class AppProfileFolderMoveDialog extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    public overwrite = false;
    public keepExisting = false;

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(OLD_PATH_TOKEN) protected readonly oldPath: string,
        @Inject(NEW_PATH_TOKEN) protected readonly newPath: string,
    ) {
        super({ cdRef });
    }
}
