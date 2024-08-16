import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, Injector, ViewChild } from "@angular/core";
import { CdkDrag, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { CdkPortal } from "@angular/cdk/portal";
import { Observable } from "rxjs";
import { BaseComponent } from "../../core/base-component";
import { AsyncState, ComponentState, ComponentStateRef, ManagedSubject } from "@lithiumjs/angular";
import { ThemeContainer } from "@lithiumjs/ngx-material-theming";
import { AppProfile } from "../../models/app-profile";
import { GameDetails } from "../../models/game-details";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";
import { Store } from "@ngxs/store";
import { AppState } from "../../state";
import { ProfileUtils } from "../../util/profile-utils";
import { OverlayHelpers, OverlayHelpersRef } from "../../services/overlay-helpers";
import { RelativeOrderedMap } from "src/app/util/relative-ordered-map";

type PluginListEntry = {
    pluginRef: GamePluginProfileRef;
    order: number | undefined;
    typeIndex: number;
    required: boolean;
    baseProfile?: string;
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
    public readonly showPluginContextMenu$ = new ManagedSubject<[MouseEvent, PluginListEntry]>(this);
    public readonly activeGameDetails$: Observable<GameDetails | undefined>;

    @Output("pluginChange")
    public readonly pluginChange$ = new EventEmitter<PluginListEntry>;

    @Output("pluginOrderChange")
    public readonly pluginOrderChange$ = new EventEmitter<GamePluginProfileRef[]>;

    @Output("pluginExternalManagementChange")
    public readonly pluginExternalManagementChange$ = new EventEmitter<never>();

    @Output("pluginTypeChange")
    public readonly pluginTypeChange$ = new EventEmitter<[GamePluginProfileRef, string]>();

    @AsyncState()
    public readonly activeGameDetails?: GameDetails;

    @Input()
    public profile!: AppProfile;

    @ViewChild("pluginContextMenu", { read: CdkPortal })
    protected readonly pluginContextMenuPortal!: CdkPortal;

    protected pluginDataSource: PluginDataSourceEntry[] = [];
    protected displayedColumns: string[] = ["enabled", "name", "order"];
    protected activeContextEntry?: PluginListEntry;
    protected pluginContextMenuRef?: OverlayHelpersRef;

    protected dropSortPredicate = (index: number, { data: itemBeingMoved }: Pick<CdkDrag<PluginListEntry>, "data">): boolean => {
        const itemAtNewLocation = this.pluginDataSource[index];

        // Ensure drag operation respects implicit plugin type order
        if (index < this.pluginDataSource.indexOf(itemBeingMoved)) {
            return itemBeingMoved.typeIndex <= itemAtNewLocation.typeIndex;
        } else {
            return itemBeingMoved.typeIndex >= itemAtNewLocation.typeIndex;
        }
    };

    constructor(
        injector: Injector,
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfilePluginListComponent>,
        store: Store,
        overlayHelpers: OverlayHelpers,
        protected readonly themeContainer: ThemeContainer
    ) {
        super({ cdRef });

        this.activeGameDetails$ = store.select(AppState.getActiveGameDetails);

        stateRef.get("profile").subscribe((profile) => {
            let pluginIndex = 0;
            const pluginDataSource = profile.plugins.map<PluginDataSourceEntry>((pluginRef) => {
                if (pluginRef.enabled) {
                    pluginIndex++;
                }

                const modRef = pluginRef.modId !== undefined ? RelativeOrderedMap.get(profile.mods, pluginRef.modId) : undefined;
                
                return {
                    pluginRef,
                    baseProfile: modRef?.baseProfile,
                    order: pluginRef.enabled ? pluginIndex : undefined,
                    typeIndex: ProfileUtils.getPluginTypeIndex(pluginRef, this.activeGameDetails!.pluginFormats) ?? 0,
                    required: !!this.activeGameDetails!.pinnedPlugins?.find((pinnedPlugin) => {
                        return pinnedPlugin.required && pluginRef.plugin === pinnedPlugin.plugin;
                    })
                };
            });

            this.pluginDataSource = pluginDataSource;
        });

        this.showPluginContextMenu$.subscribe(([event, pluginEntry]) => {
            this.activeContextEntry = pluginEntry;

            this.pluginContextMenuRef = overlayHelpers.createAttached(this.pluginContextMenuPortal, {
                x: event.clientX,
                y: event.clientY
            }, OverlayHelpers.ConnectionPositions.contextMenu, {
                injector,
                managed: false
            });

            event.stopPropagation();
            event.preventDefault();
        });
    }

    protected getPluginType(pluginEntry: PluginListEntry): string | undefined {
        return ProfileUtils.getPluginType(pluginEntry.pluginRef);
    }

    protected getDefaultPluginType(pluginEntry: PluginListEntry): string | undefined {
        return ProfileUtils.getDefaultPluginType(pluginEntry.pluginRef);
    }

    protected moveToTop(pluginEntry: PluginListEntry): void {
        const pluginOrder = this.pluginOrder;
        let firstIndex = 0;
        while (firstIndex < pluginOrder.length && !this.dropSortPredicate(firstIndex, { data: pluginEntry })) {
            ++firstIndex;
        }

        if (firstIndex < pluginOrder.length) {
            moveItemInArray(pluginOrder, pluginOrder.indexOf(pluginEntry.pluginRef), firstIndex);
            this.pluginOrderChange$.emit(pluginOrder);
        }
    }

    protected moveToBottom(pluginEntry: PluginListEntry): void {
        const pluginOrder = this.pluginOrder;
        let lastIndex = pluginOrder.length - 1;
        while (lastIndex > 0 && !this.dropSortPredicate(lastIndex, { data: pluginEntry })) {
            --lastIndex;
        }

        if (lastIndex > 0) {
            moveItemInArray(pluginOrder, pluginOrder.indexOf(pluginEntry.pluginRef), lastIndex);
            this.pluginOrderChange$.emit(pluginOrder);
        }
    }

    protected dropReorder(event: CdkDragDrop<unknown>): void {
        const pluginOrder = this.pluginOrder;

        moveItemInArray(pluginOrder, event.previousIndex, event.currentIndex);
        this.pluginOrderChange$.emit(pluginOrder);
    }

    private get pluginOrder(): GamePluginProfileRef[] {
        return this.pluginDataSource.map(({ pluginRef }) => pluginRef);
    }
}
