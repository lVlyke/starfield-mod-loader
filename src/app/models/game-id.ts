export type GameId = 
      "$none"
    | "$unknown"
    | "fallout_4"
    | "fallout_new_vegas"
    | "starfield";

export namespace GameId {

    export const NONE: GameId = "$none";
    export const UNKNOWN: GameId = "$unknown";
    export const FALLOUT_4: GameId = "fallout_4";
    export const FALLOUT_NEW_VEGAS: GameId = "fallout_new_vegas";
    export const STARFIELD: GameId = "starfield";
}
