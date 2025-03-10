import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { OverlayHelpers } from "./overlay-helpers";
import { DialogConfig, DialogManager } from "./dialog-manager";
import { DialogAction } from "./dialog-manager.types";
import { GameAction } from "../models/game-action";
import { AppModRenameDialog, MOD_CUR_NAME_TOKEN } from "../modals/mod-rename-dialog";
import { AppProfileBackupNameDialog } from "../modals/profile-backup-name-dialog";
import { AppProfileFolderMoveDialog, NEW_PATH_TOKEN, OLD_PATH_TOKEN } from "../modals/profile-folder-move-dialog";
import { AppSymlinkWarningDialog } from "../modals/symlink-warning-dialog";
import { AppCustomGameActionDialog, GAME_ACTION_TOKEN } from "../modals/custom-game-action-dialog";
import { ModSection } from "../models/mod-section";
import { AppModSectionDialog, MOD_SECTION_TOKEN } from "../modals/mod-section-dialog";

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
        return this.dialogManager.create(AppProfileBackupNameDialog, [
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

    public showProfileMoveFolderDialog(
        oldPath: string,
        newPath: string
    ): Observable<{ overwrite: boolean, destructive: boolean } | undefined> {
        return this.dialogManager.create(AppProfileFolderMoveDialog,
            [DialogManager.YES_ACTION_PRIMARY, DialogManager.NO_ACTION], {
                withModalInstance: true,
                hasBackdrop: true,
                maxWidth: "55%",
                panelClass: "mat-app-background"
            }, [[OLD_PATH_TOKEN, oldPath], [NEW_PATH_TOKEN, newPath]]
        ).pipe(
            map(result => result.action === DialogManager.YES_ACTION_PRIMARY ? {
                overwrite: result.modalInstance.overwrite,
                destructive: !result.modalInstance.keepExisting
            } : undefined)
        );
    }

    public showSymlinkWarningDialog(): Observable<unknown> {
        return this.dialogManager.create(AppSymlinkWarningDialog, [DialogManager.OK_ACTION_PRIMARY], {
            hasBackdrop: true,
            disposeOnBackdropClick: true,
            maxWidth: "35%",
            panelClass: "mat-app-background"
        });
    }

    public showAddCustomGameActionDialog(gameAction?: GameAction): Observable<GameAction | undefined> {
        const injectionTokens: OverlayHelpers.InjetorTokens = [];
        if (gameAction) {
            injectionTokens.push([GAME_ACTION_TOKEN, gameAction]);
        }

        return this.dialogManager.create(AppCustomGameActionDialog, [DialogManager.OK_ACTION_PRIMARY, DialogManager.CANCEL_ACTION], {
            withModalInstance: true,
            hasBackdrop: true,
            maxWidth: "55%",
            panelClass: "mat-app-background"
        }, injectionTokens).pipe(
            map(result => result.action === DialogManager.OK_ACTION_PRIMARY ? result.modalInstance.gameAction : undefined)
        );
    }

    public showAddModSectionDialog(section?: ModSection): Observable<ModSection | undefined> {
        const injectionTokens: OverlayHelpers.InjetorTokens = [];
        if (section) {
            injectionTokens.push([MOD_SECTION_TOKEN, section]);
        }

        return this.dialogManager.create(AppModSectionDialog, [DialogManager.OK_ACTION_PRIMARY, DialogManager.CANCEL_ACTION], {
            withModalInstance: true,
            hasBackdrop: true,
            maxWidth: "55%",
            panelClass: "mat-app-background"
        }, injectionTokens).pipe(
            map(result => result.action === DialogManager.OK_ACTION_PRIMARY ? result.modalInstance.modSection : undefined)
        );
    }
}