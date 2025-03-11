import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, InjectionToken, Optional, Output } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";

import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BaseComponent } from "../../core/base-component";
import { DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponent } from "../../components/dialog-actions";
import { GameAction } from "../../models/game-action";

export const GAME_ACTION_TOKEN = new InjectionToken<GameAction>("GAME_ACTION");

@Component({
    templateUrl: "./custom-game-action-dialog.modal.html",
    styleUrls: ["./custom-game-action-dialog.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        AppDialogActionsComponent
    ],
    providers: [
        ComponentState.create(AppCustomGameActionDialog)
    ]
})
export class AppCustomGameActionDialog extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    public gameAction: GameAction = AppCustomGameActionDialog.DEFAULT_GAME_ACTION();

    constructor(
        cdRef: ChangeDetectorRef,
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(GAME_ACTION_TOKEN) @Optional() gameAction: GameAction | undefined
    ) {
        super({ cdRef });

        this.gameAction = gameAction ?? this.gameAction;
    }

    private static DEFAULT_GAME_ACTION(): GameAction {
        return { name: "", actionScript: "" };
    }
}
