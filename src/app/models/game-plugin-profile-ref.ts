import type { AppProfile } from "./app-profile";

export interface GamePluginProfileRef {
    modId: string;
    plugin: string;
    enabled: boolean;
    verificationError?: AppProfile.PluginVerificationResult;
}
