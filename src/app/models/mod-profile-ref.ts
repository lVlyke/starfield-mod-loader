import type { AppProfile } from "./app-profile";

export interface ModProfileRef {
    enabled: boolean;
    plugins?: string[];
    updatedDate?: string;
    verificationError?: AppProfile.ModVerificationResult;
}
