import { BasicAction } from './basic-action';
import { AppData } from '../models/app-data';

export namespace AppActions {

    function createBasicAction(property: keyof AppData, action: string): BasicAction.Constructor<AppData, keyof AppData> {
        return BasicAction.create<AppData, keyof AppData>(
            "app",
            action,
            property
        );
    }

    function createUpdateAction(property: keyof AppData): BasicAction.Constructor<AppData, keyof AppData> {
        return createBasicAction(property, "update");
    }

    export type ActiveProfileAction = BasicAction<AppData, "activeProfile">;
    export type ModsActivatedAction = BasicAction<AppData, "modsActivated">;

    export const updateActiveProfile = createUpdateAction("activeProfile");
    export const activateMods = createUpdateAction("modsActivated");
}