import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from "@angular/core";
import { Observable, combineLatest } from "rxjs";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { AppState } from "../../state";
import { BaseComponent } from "../../core/base-component";
import { GameDetails } from "../../models/game-details";
import { GameDatabase } from "../../models/game-database";
import { GameId } from "../../models/game-id";

@Component({
    selector: "app-game-badge",
    templateUrl: "./game-badge.component.html",
    styleUrls: ["./game-badge.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [],
    providers: [ComponentState.create(AppGameBadgeComponent)],
    host: {
        "[style.background-color]": "gameDetails?.bkgColor ?? null",
        "[style.color]": "gameDetails?.fgColor ?? null",
        "[class.high-contrast]": "gameDetails?.fgColor === '#ffffff'",
        "[innerText]": "gameDetails?.title ?? ''"
    }
})
export class AppGameBadgeComponent extends BaseComponent {

    public readonly gameDb$: Observable<GameDatabase>;

    @Input()
    public gameDb!: GameDatabase;

    @Input()
    public gameId: GameId = GameId.UNKNOWN;

    protected gameDetails?: GameDetails;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppGameBadgeComponent>,
        store: Store
    ) {
        super({ cdRef });

        this.gameDb$ = store.select(AppState.getGameDb);

        this.gameDb$.pipe(
            this.managedSource()
        ).subscribe(gameDb => this.gameDb = gameDb);

        combineLatest(stateRef.getAll("gameId", "gameDb")).subscribe(([gameId, gameDb]) => {
            this.gameDetails = gameDb[gameId] ?? gameDb[GameId.UNKNOWN];
        });
    }
}
