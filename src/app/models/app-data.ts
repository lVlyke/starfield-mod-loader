import type { AppProfile } from "./app-profile";
import type { AppTheme } from "./app-theme";
import type { GameDatabase } from "./game-database";

export interface AppData {
    profiles: AppProfile.Description[];
    activeProfile?: AppProfile;
    theme: AppTheme;
    gameDb: GameDatabase;
    modsActivated: boolean;
    pluginsEnabled: boolean;
    normalizePathCasing: boolean;
    modListColumns?: string[];
    deployInProgress?: boolean;
}

export namespace AppData {

    export const DEFAULT_MOD_LIST_COLUMNS = [
        "enabled",
        "name",
        "order"
    ];

    export const DEFAULT_MOD_LIST_COLUMN_ORDER = [
        "enabled",
        "name",
        "updatedDate",
        "order"
    ];
}