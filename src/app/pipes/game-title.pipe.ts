import { Pipe, PipeTransform } from "@angular/core";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";
import { AppState } from "../state";

@Pipe({
    name: "appGameTitle$"
})
export class AppGameTitlePipe implements PipeTransform {

    @Select(AppState.getGameDb)
    public readonly gameDb$!: Observable<GameDatabase>;

    public transform(gameId: GameId): Observable<string> {
        return this.gameDb$.pipe(
            map((gameDb) => gameDb[gameId]?.title ?? gameId)
        );
    }
}
