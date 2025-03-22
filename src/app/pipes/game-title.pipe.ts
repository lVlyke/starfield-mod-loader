import { Pipe, PipeTransform } from "@angular/core";
import { GameId } from "../models/game-id";
import { GameDatabase } from "../models/game-database";

@Pipe({ name: "appGameTitle" })
export class AppGameTitlePipe implements PipeTransform {

    public transform(gameId: GameId, gameDb: GameDatabase): string {
        return gameDb[gameId]?.title ?? gameId;
    }
}
