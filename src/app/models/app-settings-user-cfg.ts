import { AppProfile } from "./app-profile";

export interface AppSettingsUserCfg {
    activeProfile?: string | AppProfile.Description;
    modsActivated: boolean;
    pluginsEnabled: boolean;
    normalizePathCasing: boolean;
    modListColumns?: string[];
}