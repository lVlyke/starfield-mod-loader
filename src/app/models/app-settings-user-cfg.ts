import { AppProfile } from "./app-profile";

export interface AppSettingsUserCfg {
    activeProfile?: string | AppProfile.Description;
    pluginsEnabled: boolean;
    normalizePathCasing: boolean;
    modListColumns?: string[];
    verifyProfileOnStart: boolean;
    steamCompatDataRoot?: string;
    logPanelEnabled?: boolean;
}