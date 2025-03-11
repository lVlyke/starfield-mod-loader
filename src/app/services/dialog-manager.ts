import { ComponentType } from "@angular/cdk/overlay";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { finalize, map, tap } from "rxjs/operators";
import { AppDefaultDialogComponent } from "../modals/default-dialog-modal/default-dialog-modal.component";
import { DEFAULT_DIALOG_PROMPT_TOKEN, DialogAction, DialogComponent, DIALOG_ACTIONS_TOKEN } from "./dialog-manager.types";
import { OverlayHelpers, OverlayHelpersConfig } from "./overlay-helpers";
import { runOnce } from "../core/operators";

export interface DialogConfig extends OverlayHelpersConfig {
    withModalInstance?: boolean;
}

@Injectable({ providedIn: "root" })
export class DialogManager {

    constructor (
        public readonly overlayHelpers: OverlayHelpers
    ) {}

    public create<C extends DialogComponent>(
        modalComponent: ComponentType<C>,
        actions?: DialogAction[],
        config?: undefined | (DialogConfig & { withModalInstance?: false }),
        injectionTokens?: OverlayHelpers.InjetorTokens
    ): Observable<DialogAction>;

    public create<C extends DialogComponent>(
        modalComponent: ComponentType<C>,
        actions?: DialogAction[],
        config?: DialogConfig & { withModalInstance: true },
        injectionTokens?: OverlayHelpers.InjetorTokens
    ): Observable<DialogManager.ActionWithModalInstance<C>>;

    public create<C extends DialogComponent>(
        modalComponent: ComponentType<C>,
        actions: DialogAction[] = DialogManager.DEFAULT_ACTIONS,
        config?: DialogConfig,
        injectionTokens?: OverlayHelpers.InjetorTokens
    ): Observable<DialogAction | DialogManager.ActionWithModalInstance<C>> {
        const overlayRef = this.overlayHelpers.createFullScreen<C>(modalComponent, {
            height: "auto",
            center: true,
            disposeOnBackdropClick: false,
            ...config ?? {}
        }, [
            [DIALOG_ACTIONS_TOKEN, [...actions]],
            ...injectionTokens ?? []
        ]);
        
        return runOnce(overlayRef.component.instance.actionSelected$.pipe(
            map(action => config?.withModalInstance
                ? {
                    action,
                    modalInstance: overlayRef.component.instance,
                    close: () => overlayRef.close()
                }
                : ( action )
            ),
            tap(() => overlayRef.close()),
            finalize(() => overlayRef.close())
        ));
    }

    public createDefault(
        prompt: string,
        actions: DialogAction[] = DialogManager.DEFAULT_ACTIONS,
        config?: DialogConfig,
        injectionTokens?: OverlayHelpers.InjetorTokens
    ): Observable<DialogAction> {
        return this.create(
            AppDefaultDialogComponent,
            actions,
            {
                width: "30%",
                minHeight: "25%",
                maxHeight: "90%",
                hasBackdrop: true,
                disposeOnBackdropClick: actions.length <= 1,
                ...config,
                withModalInstance: false,
                panelClass: "panel-card"
            },
            [
                [DEFAULT_DIALOG_PROMPT_TOKEN, prompt],
                ...injectionTokens ?? []
            ]
        );
    }

    public createNotice(
        prompt: string,
        action: DialogAction = DialogManager.OK_ACTION,
        config?: DialogConfig,
        injectionTokens?: OverlayHelpers.InjetorTokens
    ): Observable<DialogAction> {
        return this.createDefault(prompt, [action], config, injectionTokens);
    }
}

export namespace DialogManager {

    export interface ActionWithModalInstance<C> {
        action: DialogAction;
        modalInstance: C;
        close: () => Observable<void>;
    }

    export const YES_ACTION = { label: "Yes" };
    export const YES_ACTION_PRIMARY = { ...YES_ACTION, primary: true };
    export const YES_ACTION_ACCENT = { ...YES_ACTION, accent: true };

    export const NO_ACTION = { label: "No" };
    export const NO_ACTION_PRIMARY = { ...NO_ACTION, primary: true };
    export const NO_ACTION_ACCENT = { ...NO_ACTION, accent: true };

    export const OK_ACTION = { label: "OK" };
    export const OK_ACTION_PRIMARY = { ...OK_ACTION, primary: true };
    export const OK_ACTION_ACCENT = { ...OK_ACTION, accent: true };

    export const CANCEL_ACTION = { label: "Cancel" };
    export const CANCEL_ACTION_PRIMARY = { ...CANCEL_ACTION, primary: true };
    export const CANCEL_ACTION_ACCENT = { ...CANCEL_ACTION, accent: true };

    // Default actions:
    export const DEFAULT_ACTIONS: DialogAction[] = [
        OK_ACTION_PRIMARY,
        CANCEL_ACTION
    ];

    // Positive actions:
    export const POSITIVE_ACTIONS: DialogAction[] = [
        YES_ACTION,
        YES_ACTION_PRIMARY,
        YES_ACTION_ACCENT,
        OK_ACTION,
        OK_ACTION_PRIMARY,
        OK_ACTION_ACCENT
    ];

    // Negative actions:
    export const NEGATIVE_ACTIONS: DialogAction[] = [
        NO_ACTION,
        NO_ACTION_PRIMARY,
        NO_ACTION_ACCENT,
        CANCEL_ACTION,
        CANCEL_ACTION_PRIMARY,
        CANCEL_ACTION_ACCENT
    ];
}
