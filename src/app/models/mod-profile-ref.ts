import type { AppProfile } from "./app-profile";

export interface ModProfileRef {
    enabled: boolean;
    updatedDate?: string;
    verificationError?: AppProfile.VerificationResult;
}
