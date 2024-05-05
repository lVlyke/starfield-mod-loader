import type { AppProfile } from "./app-profile";

export interface GamePluginProfileRef {
    modId?: string; // Plugin is external if undefined
    plugin: string;
    enabled: boolean;
    promotedType?: string;
    verificationError?: AppProfile.VerificationResult;
}
