import { EventEmitter, InjectionToken } from "@angular/core";

export const DIALOG_ACTIONS_TOKEN = new InjectionToken<DialogAction>("DIALOG_ACTIONS");
export const DEFAULT_DIALOG_PROMPT_TOKEN = new InjectionToken<string>("DEFAULT_DIALOG_PROMPT");

export interface DialogAction {
    label: string;
    primary?: boolean;
}

export interface DialogComponent {
    actionSelected$: EventEmitter<DialogAction>;
}
