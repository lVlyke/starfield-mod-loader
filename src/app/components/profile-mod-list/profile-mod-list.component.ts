import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { BaseComponent } from "../../core/base-component";
import { ComponentState } from "@lithiumjs/angular";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";

@Component({
    selector: "app-profile-mod-list",
    templateUrl: "./profile-mod-list.component.html",
    styleUrls: ["./profile-mod-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileModListComponent),
    ]
})
export class AppProfileModListComponent extends BaseComponent {

    public readonly assign = Object.assign;

    @Output("modChange")
    public readonly modChange$ = new EventEmitter<{ name: string, modRef: ModProfileRef }>;

    @Input()
    public profile!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });
    }
}
