import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { MatActionList, MatListItem } from "@angular/material/list";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIcon } from "@angular/material/icon";
import { MatDivider } from "@angular/material/divider";
import { MatIconButton } from "@angular/material/button";
import { MatLine } from "@angular/material/core";
import { AppProfileBackupNamePipe } from "../../pipes";

@Component({
    selector: "app-profile-backup-list",
    templateUrl: "./profile-backup-list.component.html",
    styleUrls: ["./profile-backup-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DatePipe,

        MatActionList,
        MatListItem,
        MatLine,
        MatTooltip,
        MatIcon,
        MatDivider,
        MatIconButton,

        AppProfileBackupNamePipe
    ],
    providers: [ComponentState.create(AppProfileBackupListComponent)]
})
export class AppProfileBackupListComponent extends BaseComponent {

    @Output("backupSelect")
    public readonly backupSelect$ = new EventEmitter<AppProfile.BackupEntry>();

    @Output("backupDelete")
    public readonly backupDelete$ = new EventEmitter<AppProfile.BackupEntry>();

    @Output("exploreBackups")
    public readonly exploreBackups$ = new EventEmitter<void>();

    @Input()
    public backupFileEntries?: AppProfile.BackupEntry[] | null;

    constructor(cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }
}
