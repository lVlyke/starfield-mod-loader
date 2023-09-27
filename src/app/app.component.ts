import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { AsyncState, ComponentState } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { BaseComponent } from "./core/base-component";
import { AppState } from "./state";
import { AppTheme } from "./models/app-theme";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppComponent)]
})
export class AppComponent extends BaseComponent {

    @Select(AppState.getTheme)
    public readonly theme$!: Observable<AppTheme>;

    @AsyncState()
    public readonly theme!: AppTheme;

    constructor (cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }
}
