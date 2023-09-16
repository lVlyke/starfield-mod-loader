import type { AppProfile } from "./app-profile";
import type { AppTheme } from "./app-theme";
import type { GameDatabase } from "./game-database";

export interface AppData {
    profileNames: string[];
    activeProfile?: AppProfile;
    theme: AppTheme;
    gameDb: GameDatabase;
    modsActivated: boolean;
    deployInProgress?: boolean;
}