import type { AppProfile } from "./app-profile";

export interface ModProfileRef {
    enabled: boolean;
    baseProfile?: string;
    updatedDate?: string;
    verificationError?: AppProfile.VerificationResult;
}
