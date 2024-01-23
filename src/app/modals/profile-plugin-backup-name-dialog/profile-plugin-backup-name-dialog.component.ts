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
import { CommonModule, formatDate } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";

export const BACKUP_NAME_TOKEN = new InjectionToken<string>("BACKUP_NAME_TOKEN");

@Component({
    templateUrl: "./profile-plugin-backup-name-dialog.component.html",
    styleUrls: ["./profile-plugin-backup-name-dialog.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfilePluginBackupNameDialog)
    ],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ]
})
export class AppProfilePluginBackupNameDialog extends BaseComponent implements DialogComponent {

    @Output()
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
