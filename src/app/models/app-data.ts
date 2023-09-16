import type { AppProfile } from "./app-profile";
import type { AppTheme } from "./app-theme";

export interface AppData {
    profileNames: string[];
    activeProfile?: AppProfile;
    theme: AppTheme;
    modsActivated: boolean;
    deployInProgress?: boolean;
}