import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { filterTrue } from "../../core/operators";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";
import { DialogManager } from "../../services/dialog-manager";
import { AppDialogs } from "../../services/app-dialogs";

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
    public root!: boolean;

    @Input()
    public modName!: string;

    @Input()
    public modRef!: ModProfileRef;

    constructor(
        cdRef: ChangeDetectorRef,
        private readonly profileManager: ProfileManager,
        private readonly appDialogs: AppDialogs
    ) {
        super({ cdRef });
    }

    protected showModInFileExplorer(): void {
        this.profileManager.showModInFileExplorer(this.modName);

        this.actionSelect$.emit();
    }

    protected deleteMod(): void {
        this.appDialogs.showDefault("Are you sure you want to delete this mod?", [
            DialogManager.YES_ACTION,
            DialogManager.NO_ACTION_PRIMARY
        ]).pipe(
            filterTrue()
        ).subscribe(() => this.profileManager.deleteMod(this.root, this.modName));

        this.actionSelect$.emit();
    }

    protected renameMod(): void {
        this.profileManager.renameModFromUser(this.root, this.modName);

        this.actionSelect$.emit();
    }

    protected moveModToTop(): void {
        this.profileManager.moveModToTopOfOrder(this.root, this.modName);

        this.actionSelect$.emit();
    }

    protected moveModToBottom(): void {
        this.profileManager.moveModToBottomOfOrder(this.root, this.modName);

        this.actionSelect$.emit();
    }
}
