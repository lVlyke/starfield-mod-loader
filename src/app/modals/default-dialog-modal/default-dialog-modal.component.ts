import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Output, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { MatCardModule } from "@angular/material/card";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { DEFAULT_DIALOG_PROMPT_TOKEN, DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "../../services/dialog-manager.types";
import { AppDialogActionsComponent } from "../../components/dialog-actions";
import { BaseComponent } from "../../core/base-component";

@Component({
    templateUrl: "./default-dialog-modal.component.html",
    styleUrls: ["./default-dialog-modal.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCardModule,

        AppDialogActionsComponent
    ],
    providers: [ComponentState.create(AppDefaultDialogComponent)]
})
export class AppDefaultDialogComponent extends BaseComponent implements DialogComponent {

    @Output("actionSelected")
    public readonly actionSelected$ = new EventEmitter<DialogAction>();

    protected renderedPrompt: string | SafeHtml | null = null;

    constructor(
        @Inject(DIALOG_ACTIONS_TOKEN) public readonly actions: DialogAction[],
        @Inject(DEFAULT_DIALOG_PROMPT_TOKEN) public prompt: string,
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppDefaultDialogComponent>,
        domSanitizer: DomSanitizer
    ) {
        super({ cdRef });

        stateRef.get("prompt").subscribe((prompt) => {
            this.renderedPrompt = domSanitizer.sanitize(SecurityContext.HTML, prompt);
        });
    }
}
