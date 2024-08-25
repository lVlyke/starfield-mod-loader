import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { DialogConfig, DialogManager } from "./dialog-manager";
import { DialogAction } from "./dialog-manager.types";
import { AppModRenameDialog, MOD_CUR_NAME_TOKEN } from "../modals/mod-rename-dialog";
import { AppProfilePluginBackupNameDialog } from "../modals/profile-plugin-backup-name-dialog";

@Injectable({ providedIn: "root" })
export class AppDialogs {

    constructor(
        public readonly dialogManager: DialogManager
    ) {}

    public showDefault(
        prompt: string,
        actions: DialogAction[] = DialogManager.DEFAULT_ACTIONS,
        actionMatch: DialogAction[] = DialogManager.POSITIVE_ACTIONS,
        config?: DialogConfig
    ): Observable<boolean> {
        return this.dialogManager.createDefault(prompt, actions, config).pipe(
            map(result => actionMatch.includes(result))
        );
    }

    public showModRenameDialog(modCurName: string): Observable<string | undefined> {
        return this.dialogManager.create(AppModRenameDialog, [
                DialogManager.OK_ACTION_PRIMARY,
                DialogManager.CANCEL_ACTION
            ], {
                withModalInstance: true,
                maxWidth: "35%",
                panelClass: "mat-app-background"
            },
            [[MOD_CUR_NAME_TOKEN, modCurName]]
        ).pipe(
            map(result => result.action === DialogManager.OK_ACTION_PRIMARY
                ? result.modalInstance.modName
                : undefined
            )
        );
    }

    public showProfileBackupNameDialog(): Observable<string | undefined> {
        return this.dialogManager.create(AppProfilePluginBackupNameDialog, [
                DialogManager.OK_ACTION_PRIMARY,
                DialogManager.CANCEL_ACTION
            ], {
                hasBackdrop: true,
                disposeOnBackdropClick: true,
                withModalInstance: true,
                maxWidth: "35%",
                panelClass: "mat-app-background"
            }
        ).pipe(
            map(result => result.action === DialogManager.OK_ACTION_PRIMARY
                ? result.modalInstance.backupName
                : undefined
            )
        );
    }
}