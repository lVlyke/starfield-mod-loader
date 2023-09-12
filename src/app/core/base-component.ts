import { Directive, ChangeDetectorRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AutoPush } from "@lithiumjs/angular";

@Directive()
export abstract class BaseComponent {

    public readonly managedSource = takeUntilDestroyed;

    constructor(config: BaseComponent.Config) {
        if (config.cdRef) {
            AutoPush.enable(this, config.cdRef);
        }
    }
}

export namespace BaseComponent {

    export interface Config {
        cdRef?: ChangeDetectorRef;
    }
}