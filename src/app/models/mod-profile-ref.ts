import type { AppProfile } from "./app-profile";

export interface ModProfileRef {
    enabled: boolean;
    verificationError?: AppProfile.ModVerificationResult;
}
