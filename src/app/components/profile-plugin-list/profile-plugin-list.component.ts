import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from "@angular/core";
import { CdkDrag, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Observable, combineLatest } from "rxjs";
import { BaseComponent } from "../../core/base-component";
import { AsyncState, ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { ThemeContainer } from "@lithiumjs/ngx-material-theming";
import { AppProfile } from "../../models/app-profile";
import { GameDetails } from "../../models/game-details";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";
import { Select } from "@ngxs/store";
import { AppState } from "../../state";
import { ProfileUtils } from "../../util/profile-utils";

type PluginListEntry = {
    pluginRef: GamePluginProfileRef;
    order: number | undefined;
    typeIndex: number;
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

    @Select(AppState.getActiveGameDetails)
    public readonly activeGameDetails$!: Observable<GameDetails>;

    @Output("pluginChange")
    public readonly pluginChange$ = new EventEmitter<PluginListEntry>;

    @Output("pluginOrderChange")
    public readonly pluginOrderChange$ = new EventEmitter<GamePluginProfileRef[]>;

    @AsyncState()
    public readonly activeGameDetails!: GameDetails;

    @Input()
    public profile!: AppProfile;

    protected pluginDataSource: PluginDataSourceEntry[] = [];
    protected displayedColumns: string[] = ["enabled", "name", "order"];

    protected dropSortPredicate = (index: number, item: CdkDrag<PluginListEntry>): boolean => {
        const itemAtNewLocation = this.pluginDataSource[index];
        const itemBeingMoved = item.data;

        // Ensure drag operation respects implicit plugin type order
        if (index < this.pluginDataSource.indexOf(itemBeingMoved)) {
            return itemBeingMoved.typeIndex <= itemAtNewLocation.typeIndex;
        } else {
            return itemBeingMoved.typeIndex >= itemAtNewLocation.typeIndex;
        }
    };

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
                    order: pluginRef.enabled ? pluginIndex : undefined,
                    typeIndex: ProfileUtils.getPluginTypeIndex(pluginRef, this.activeGameDetails.pluginFormats) ?? 0
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
