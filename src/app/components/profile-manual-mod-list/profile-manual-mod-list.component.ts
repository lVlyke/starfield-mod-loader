import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from "@angular/core";
import { BaseComponent } from "../../core/base-component";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { AppProfile } from "../../models/app-profile";

@Component({
    selector: "app-profile-manual-mod-list",
    templateUrl: "./profile-manual-mod-list.component.html",
    styleUrls: ["./profile-manual-mod-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileManualModListComponent),
    ]
})
export class AppProfileManualModListComponent extends BaseComponent {

    @Input()
    public profile!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileManualModListComponent>
    ) {
        super({ cdRef });

        stateRef.get("profile").subscribe((profile) => {
            
        });
    }
}
