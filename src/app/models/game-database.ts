import type { GameId } from "./game-id";
import type { GameDetails } from "./game-details";

export type GameDatabase = Record<GameId, GameDetails>;