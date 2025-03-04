import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { ComponentState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { DialogAction } from "../../services/dialog-manager.types";

@Component({
    selector: "app-dialog-actions",
    templateUrl: "./dialog-actions.component.html",
    styleUrls: ["./dialog-actions.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppDialogActionsComponent)],
    standalone: false
})
export class AppDialogActionsComponent extends BaseComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    @Input()
    public actions: DialogAction[] = [];

    constructor(cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }
}
