import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, Injector } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { BaseComponent } from "../../core/base-component";
import { ComponentState, ComponentStateRef, ManagedSubject } from "@lithiumjs/angular";
import { ThemeContainer } from "@lithiumjs/ngx-material-theming";
import { AppProfile } from "../../models/app-profile";
import { ModProfileRef } from "../../models/mod-profile-ref";
import { OverlayHelpers } from "../../services/overlay-helpers";
import { AppModContextMenuModal } from "../../modals/mod-context-menu";

type ModListEntry = { name: string, modRef: ModProfileRef };

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
    public readonly showModContextMenu$ = new ManagedSubject<[MouseEvent, ModListEntry]>(this);

    @Output("modChange")
    public readonly modChange$ = new EventEmitter<ModListEntry>;

    @Output("modOrderChange")
    public readonly modOrderChange$ = new EventEmitter<string[]>;

    @Input()
    public profile!: AppProfile;

    protected modList: ModListEntry[] = [];

    constructor(
        injector: Injector,
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileModListComponent>,
        overlayHelpers: OverlayHelpers,
        protected readonly themeContainer: ThemeContainer
    ) {
        super({ cdRef });

        stateRef.get("profile").subscribe(profile => this.modList = Array.from(profile.mods.entries()).map(([name, modRef]) => {
            return { name, modRef };
        }));

        this.showModContextMenu$.subscribe(([event, { name, modRef }]) => {
            const modContextMenuRef = overlayHelpers.createAttached(AppModContextMenuModal, {
                x: event.clientX,
                y: event.clientY
            }, OverlayHelpers.ConnectionPositions.contextMenu, {
                injector,
                managed: false
            });

            modContextMenuRef.component.instance.modName = name;
            modContextMenuRef.component.instance.modRef = modRef;

            event.stopPropagation();
            event.preventDefault();
        });
    }

    protected dropReorder(event: CdkDragDrop<unknown>): void {
        const modOrder = this.modList.map(({ name }) => name);
        moveItemInArray(modOrder, event.previousIndex, event.currentIndex);
        
        this.modOrderChange$.emit(modOrder);
    }
}
