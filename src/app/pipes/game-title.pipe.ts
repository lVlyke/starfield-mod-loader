import { Pipe, PipeTransform } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";
import { AppState } from "../state";

@Pipe({
    name: "appGameTitle$",
    standalone: false
})
export class AppGameTitlePipe implements PipeTransform {

    public readonly gameDb$: Observable<GameDatabase>;

    constructor (store: Store) {
        this.gameDb$ = store.select(AppState.getGameDb);
    }

    public transform(gameId: GameId): Observable<string> {
        return this.gameDb$.pipe(
            map((gameDb) => gameDb[gameId]?.title ?? gameId)
        );
    }
}
