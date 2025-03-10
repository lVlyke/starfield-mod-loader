import { 
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    InjectionToken,
    LOCALE_ID,
    Optional,
    Output
} from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { formatDate } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponentModule } from "../../components/dialog-actions";

export const BACKUP_NAME_TOKEN = new InjectionToken<string>("BACKUP_NAME_TOKEN");

@Component({
    templateUrl: "./profile-backup-name-dialog.component.html",
    styleUrls: ["./profile-backup-name-dialog.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileBackupNameDialog)
    ],
    imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    AppDialogActionsComponentModule
]
})
export class AppProfileBackupNameDialog extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(LOCALE_ID) private readonly locale: string,
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(BACKUP_NAME_TOKEN) @Optional() protected _backupName: string
    ) {
        super({ cdRef });

        this._backupName ??= this.defaultName;
    }

    public get backupName(): string {
        return this._backupName || this.defaultName;
    }

    protected get defaultName(): string {
        return formatDate(new Date(), "medium", this.locale)!;
    }
}
