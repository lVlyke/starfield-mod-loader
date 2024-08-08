import _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, Injector } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Store } from "@ngxs/store";
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
import { AppProfileExternalFilesListModal, FILE_LIST_TOKEN } from "../../modals/profile-external-files-list";

type ModListEntry = {
    name: string;
    modRef: ModProfileRef;
    order: number | undefined;
};

type ModListDataSource = Array<ModListEntry | "manual">;

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
    public readonly modListColumns$: Observable<string[] | undefined>;

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

    protected modEntries: ModListEntry[] = [];
    protected displayedColumns: string[] = [];
    protected externalModFiles: string[] = [];
    protected modListDataSource: ModListDataSource = [];

    constructor(
        injector: Injector,
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileModListComponent>,
        store: Store,
        private readonly overlayHelpers: OverlayHelpers,
        protected readonly themeContainer: ThemeContainer
    ) {
        super({ cdRef });

        this.modListColumns$ = store.select(AppState.getModListColumns);

        combineLatest(stateRef.getAll(
            "profile",
            "root",
            "showManualMods"
        )).subscribe(([profile, root, showManualMods]) => {
            this.externalModFiles = (root
                ? profile.externalFilesCache?.gameDirFiles
                : profile.externalFilesCache?.modDirFiles) ?? [];

            // Create list entries
            let modIndex = 0;
            const modsList = root ? profile.rootMods : profile.mods;
            this.modEntries = Array.from(modsList.entries()).map<ModListEntry>(([name, modRef]) => {
                if (modRef.enabled) {
                    modIndex++;
                }
                
                return {
                    name,
                    modRef,
                    order: modRef.enabled ? modIndex : undefined
                };
            });
            
            const modListDataSource: ModListDataSource = [];
            // Show manual mods entry if requested
            if (showManualMods && !!this.externalModFiles.length) {
                modListDataSource.push("manual");
            }

            modListDataSource.push(...this.modEntries);
            this.modListDataSource = modListDataSource;
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
        const modOrder = this.modEntries.map(({ name }) => name);
        const firstIndex = this.modListDataSource[0] === "manual" ? 1 : 0;

        moveItemInArray(modOrder, event.previousIndex - firstIndex, event.currentIndex - firstIndex);
        this.modOrderChange$.emit(modOrder);
    }

    protected showExternalFileList(): void {
        this.overlayHelpers.createFullScreen(AppProfileExternalFilesListModal, {
            hasBackdrop: true,
            width: "40vw",
            height: "auto",
            maxHeight: "80vh",
            panelClass: "mat-app-background"
        }, [[FILE_LIST_TOKEN, this.externalModFiles]]);
    }
}
