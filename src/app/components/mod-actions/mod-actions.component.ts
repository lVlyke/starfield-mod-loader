import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { ProfileManager } from "../../services/profile-manager";

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
        private readonly profileManager: ProfileManager
    ) {
        super({ cdRef });
    }

    protected showModInFileExplorer(): void {
        this.profileManager.showModInFileExplorer(this.modRef);

        this.actionSelect$.emit();
    }

    protected deleteMod(): void {
        this.profileManager.deleteMod(this.modName);

        this.actionSelect$.emit();
    }
}
