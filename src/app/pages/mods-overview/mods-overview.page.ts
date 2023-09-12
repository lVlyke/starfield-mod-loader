import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { ComponentState, AsyncState, AfterViewInit } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { AppState } from "../../state";
import { BasePage } from "../../core/base-page";
import { Observable } from "rxjs";
import { AppProfile } from "src/app/models/app-profile";

@Component({
    selector: "app-mods-overview-page",
    templateUrl: "./mods-overview.page.html",
    styleUrls: ["./mods-overview.page.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppModsOverviewPage)]
})
export class AppModsOverviewPage extends BasePage {

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile | undefined>;

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AfterViewInit()
    private afterViewInit$!: Observable<void>;

    constructor(cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }
}
