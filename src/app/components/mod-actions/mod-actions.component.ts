import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { filter } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { DialogManager } from "../../services/dialog-manager";

@Component({
    selector: "app-mod-actions",
    templateUrl: "./mod-actions.component.html",
    styleUrls: ["./mod-actions.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModActionsComponent),
    ]
})
export class AppModActionsComponent extends BaseComponent {

    @Output("actionSelect")
    public readonly actionSelect$ = new EventEmitter<void>();

    @Input()
    public modName!: string;

    @Input()
    public modRef!: ModProfileRef;

    constructor(
        cdRef: ChangeDetectorRef,
        private readonly profileManager: ProfileManager,
        private readonly dialogManager: DialogManager
    ) {
        super({ cdRef });
    }

    protected showModInFileExplorer(): void {
        this.profileManager.showModInFileExplorer(this.modName);

        this.actionSelect$.emit();
    }

    protected deleteMod(): void {
        this.dialogManager.createDefault("Are you sure you want to delete this mod?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filter(choice => choice === DialogManager.YES_ACTION)
        ).subscribe(() => this.profileManager.deleteMod(this.modName));

        this.actionSelect$.emit();
    }

    protected renameMod(): void {
        this.profileManager.renameModFromUser(this.modName);

        this.actionSelect$.emit();
    }
}
