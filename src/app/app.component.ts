import { APP_INITIALIZER, Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AsyncState, ComponentState } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { NgxMaterialThemingModule } from "@lithiumjs/ngx-material-theming";
import { Observable } from "rxjs";
import { BaseComponent } from "./core/base-component";
import { AppState } from "./state";
import { AppTheme } from "./models/app-theme";

import { ProfileManager } from "./services/profile-manager";
import { AppMessageHandler } from "./services/app-message-handler";
import { AppStateBehaviorManager } from "./services/app-state-behavior-manager";

const STARTUP_SERVICES = [
    AppMessageHandler,
    AppStateBehaviorManager,
    ProfileManager
];

@Component({
    standalone: true,
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterModule,
        MatIconModule,
        NgxMaterialThemingModule
    ],
    providers: [
        // Startup services:
        {
            provide: APP_INITIALIZER,
            useFactory: APP_INITIALIZER_FACTORY,
            deps: STARTUP_SERVICES,
            multi: true
        },
        ComponentState.create(AppComponent)
    ]
})
export class AppComponent extends BaseComponent {

    public readonly theme$: Observable<AppTheme>;

    @AsyncState()
    public readonly theme!: AppTheme;

    constructor (cdRef: ChangeDetectorRef, store: Store, iconRegistry: MatIconRegistry) {
        super({ cdRef });

        // Register Material Icons font
        iconRegistry.setDefaultFontSetClass("material-icons-font-set");

        this.theme$ = store.select(AppState.getTheme);
    }
}

export function APP_INITIALIZER_FACTORY() {
    return function () {};
  }
  