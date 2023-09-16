import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { AppModRenameDialog, MOD_CUR_NAME_TOKEN } from "../modals/mod-rename-dialog";
import { DialogManager } from "./dialog-manager";

@Injectable({ providedIn: "root" })
export class AppDialogs {

    constructor(
        public readonly dialogManager: DialogManager
    ) {}

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
}