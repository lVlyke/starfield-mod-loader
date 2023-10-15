export interface AppSettingsUserCfg {
    profiles: string[];
    activeProfile?: string;
    modsActivated: boolean;
    pluginsEnabled: boolean;
    normalizePathCasing: boolean;
    modListColumns?: string[];
}