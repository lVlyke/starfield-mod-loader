import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { combineLatest } from "rxjs";
import { BaseComponent } from "../../core/base-component";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { ThemeContainer } from "@lithiumjs/ngx-material-theming";
import { AppProfile } from "../../models/app-profile";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";

type PluginListEntry = {
    pluginRef: GamePluginProfileRef;
    order: number | undefined;
};

type PluginDataSourceEntry = PluginListEntry;

@Component({
    selector: "app-profile-plugin-list",
    templateUrl: "./profile-plugin-list.component.html",
    styleUrls: ["./profile-plugin-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfilePluginListComponent),
    ]
})
export class AppProfilePluginListComponent extends BaseComponent {

    public readonly assign = Object.assign;

    @Output("pluginChange")
    public readonly pluginChange$ = new EventEmitter<PluginListEntry>;

    @Output("pluginOrderChange")
    public readonly pluginOrderChange$ = new EventEmitter<GamePluginProfileRef[]>;

    @Input()
    public profile!: AppProfile;

    protected pluginDataSource: PluginDataSourceEntry[] = [];
    protected displayedColumns: string[] = ["enabled", "name", "order"];

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfilePluginListComponent>,
        protected readonly themeContainer: ThemeContainer
    ) {
        super({ cdRef });

        combineLatest(stateRef.getAll(
            "profile"
        )).subscribe(([profile]) => {
            let pluginIndex = 0;
            const pluginDataSource = profile.plugins.map<PluginDataSourceEntry>((pluginRef) => {
                if (pluginRef.enabled) {
                    pluginIndex++;
                }
                
                return {
                    pluginRef,
                    order: pluginRef.enabled ? pluginIndex : undefined
                };
            });

            this.pluginDataSource = pluginDataSource;
        });
    }

    protected dropReorder(event: CdkDragDrop<unknown>): void {
        const pluginOrder = this.pluginDataSource.map(({ pluginRef }) => pluginRef);

        moveItemInArray(pluginOrder, event.previousIndex, event.currentIndex);
        this.pluginOrderChange$.emit(pluginOrder);
    }
}
