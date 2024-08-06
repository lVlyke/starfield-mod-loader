import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from "@angular/core";
import { Observable, combineLatest } from "rxjs";
import { AsyncState, ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { AppState } from "../../state";
import { BaseComponent } from "../../core/base-component";
import { GameDetails } from "../../models/game-details";
import { GameDatabase } from "../../models/game-database";

@Component({
    selector: "app-game-badge",
    templateUrl: "./game-badge.component.html",
    styleUrls: ["./game-badge.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppGameBadgeComponent)],
    host: {
        "[style.background-color]": "gameDetails?.bkgColor ?? null",
        "[style.color]": "gameDetails?.fgColor ?? null"
    }
})
export class AppGameBadgeComponent extends BaseComponent {

    public readonly gameDb$: Observable<GameDatabase>;

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @Input()
    public gameId!: string;

    protected gameDetails?: GameDetails;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppGameBadgeComponent>,
        store: Store
    ) {
        super({ cdRef });

        this.gameDb$ = store.select(AppState.getGameDb);

        combineLatest(stateRef.getAll("gameId", "gameDb")).subscribe(([gameId, gameDb]) => {
            this.gameDetails = gameDb[gameId];
        });
    }
}
