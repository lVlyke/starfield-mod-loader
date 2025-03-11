export type GameId = 
      "$none"
    | "$unknown"
    | "elder_scrolls_oblivion"
    | "fallout_4"
    | "fallout_new_vegas"
    | "starfield";

export namespace GameId {

    export const NONE: GameId = "$none";
    export const UNKNOWN: GameId = "$unknown";
    export const ELDER_SCROLLS_OBLIVION: GameId = "elder_scrolls_oblivion";
    export const FALLOUT_4: GameId = "fallout_4";
    export const FALLOUT_NEW_VEGAS: GameId = "fallout_new_vegas";
    export const STARFIELD: GameId = "starfield";
}
