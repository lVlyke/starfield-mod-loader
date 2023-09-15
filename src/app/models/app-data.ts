import { AppProfile } from "./app-profile";

export interface AppData {
    profileNames: string[];
    activeProfile?: AppProfile;
    modsActivated: boolean;
}