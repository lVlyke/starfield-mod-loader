import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { BaseComponent } from "../../core/base-component";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
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

    @Output("modOrderChange")
    public readonly modOrderChange$ = new EventEmitter<string[]>;

    @Input()
    public profile!: AppProfile;

    protected modList: { name: string, modRef: ModProfileRef }[] = [];

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileModListComponent>
    ) {
        super({ cdRef });

        stateRef.get("profile").subscribe(profile => this.modList = Array.from(profile.mods.entries()).map(([name, modRef]) => {
            return { name, modRef };
        }));
    }

    protected dropReorder(event: CdkDragDrop<unknown>): void {
        const modOrder = this.modList.map(({ name }) => name);
        moveItemInArray(modOrder, event.previousIndex, event.currentIndex);
        
        this.modOrderChange$.emit(modOrder);
    }
}
