import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, Injector } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Select } from "@ngxs/store";
import { Observable, combineLatest } from "rxjs";
import { BaseComponent } from "../../core/base-component";
import { AsyncState, ComponentState, ComponentStateRef, ManagedSubject } from "@lithiumjs/angular";
import { ThemeContainer } from "@lithiumjs/ngx-material-theming";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { OverlayHelpers } from "../../services/overlay-helpers";
import { AppModContextMenuModal } from "../../modals/mod-context-menu";
import { AppState } from "../../state";
import { AppData } from "../../models/app-data";
import { AppProfileExternalFilesListModal, PROFILE_TOKEN } from "../../modals/profile-external-files-list";

type ModListEntry = {
    name: string;
    modRef: ModProfileRef;
    order: number | undefined;
};

type ModDataSourceEntry = ModListEntry | "manual";

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
    public readonly defaultColumns = AppData.DEFAULT_MOD_LIST_COLUMNS;
    public readonly defaultColumnOrder = AppData.DEFAULT_MOD_LIST_COLUMN_ORDER;
    public readonly showModContextMenu$ = new ManagedSubject<[MouseEvent, ModListEntry]>(this);

    @Select(AppState.getModListColumns)
    public readonly modListColumns$!: Observable<string[] | undefined>;

    @Output("modChange")
    public readonly modChange$ = new EventEmitter<ModListEntry>;

    @Output("modOrderChange")
    public readonly modOrderChange$ = new EventEmitter<string[]>;

    @AsyncState()
    public readonly modListColumns!: string[] | undefined;

    @Input()
    public profile!: AppProfile;

    @Input()
    public root!: boolean;

    @Input()
    public showManualMods: boolean = true;

    protected modDataSource: ModDataSourceEntry[] = [];
    protected displayedColumns: string[] = [];

    constructor(
        injector: Injector,
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileModListComponent>,
        private readonly overlayHelpers: OverlayHelpers,
        protected readonly themeContainer: ThemeContainer
    ) {
        super({ cdRef });

        combineLatest(stateRef.getAll(
            "profile",
            "root",
            "showManualMods"
        )).subscribe(([profile, root, showManualMods]) => {
            let modIndex = 0;
            const modsList = root ? profile.rootMods : profile.mods;
            const modDataSource = Array.from(modsList.entries()).map<ModDataSourceEntry>(([name, modRef]) => {
                if (modRef.enabled) {
                    modIndex++;
                }
                
                return {
                    name,
                    modRef,
                    order: modRef.enabled ? modIndex : undefined
                };
            });

            if (showManualMods && !!profile.manualMods?.length) {
                modDataSource.push("manual");
            }

            this.modDataSource = modDataSource;
        });

        stateRef.get("modListColumns").subscribe((modListColumns) => {
            const cols = modListColumns ?? this.defaultColumns;

            // Display columns in defined order
            this.displayedColumns = this.defaultColumnOrder.filter(
                col => cols.includes(col)
            );
        });

        this.showModContextMenu$.subscribe(([event, modEntry]) => {
            const modContextMenuRef = overlayHelpers.createAttached(AppModContextMenuModal, {
                x: event.clientX,
                y: event.clientY
            }, OverlayHelpers.ConnectionPositions.contextMenu, {
                injector,
                managed: false
            });

            modContextMenuRef.component.instance.root = this.root;
            modContextMenuRef.component.instance.modName = modEntry.name;
            modContextMenuRef.component.instance.modRef = modEntry.modRef;

            event.stopPropagation();
            event.preventDefault();
        });
    }

    protected dropReorder(event: CdkDragDrop<unknown>): void {
        const modOrder = this.modDataSource
            .filter((entry): entry is ModListEntry => entry !== "manual")
            .map(({ name }) => name);

        moveItemInArray(modOrder, event.previousIndex, event.currentIndex);
        this.modOrderChange$.emit(modOrder);
    }

    protected showExternalFileList(): void {
        this.overlayHelpers.createFullScreen(AppProfileExternalFilesListModal, {
            hasBackdrop: true,
            width: "40vw",
            height: "auto",
            maxHeight: "80vh",
            panelClass: "mat-app-background"
        }, [[PROFILE_TOKEN, this.profile]]);
    }
}
