import { Pipe, PipeTransform } from "@angular/core";
import { AppProfile } from "../../models/app-profile";

export interface DefaultProfilePathField {
    formId: keyof AppProfile.DefaultablePaths;
    title: string;
    required: boolean;
    fileTypes?: string[];
}

export interface DefaultProfilePathFieldGroup {
    formId: string;
    groupTitle: string;
    fields: DefaultProfilePathField[];
    hint?: string;
}

export type DefaultProfilePathFieldEntry = DefaultProfilePathField | DefaultProfilePathFieldGroup;

function PROFILE_OVERRIDE_FIELDS(formModel: Partial<AppProfile.Form>): Readonly<DefaultProfilePathFieldEntry[]> {
    return [
        { formId: "profilePathOverrides", groupTitle: "Profile Path Overrides", hint: "Override standard profile paths", fields: [
            { formId: "rootPathOverride", title: "Profile Root Path", required: false },
            { formId: "modsPathOverride", title: "Profile Mods Path", required: false },
            { formId: "savesPathOverride", title: "Profile Saves Path", required: false },
            { formId: "configPathOverride", title: "Profile Config Path", required: false },
            { formId: "backupsPathOverride", title: "Profile Backups Path", required: false },
        ] }
    ];
}

function STANDARD_FIELDS(formModel: Partial<AppProfile.Form>): Readonly<DefaultProfilePathFieldEntry[]> {
    return [
        { formId: "modBaseDir", title: "Game Data Directory", required: true },
        { formId: "gameBaseDir", title: "Game Root Directory", required: true },
        { formId: "gameBinaryPath", title: "Game Executable", fileTypes: ["exe", "bat", "cmd", "lnk", "sh"], required: true },
        { formId: "pluginListPath", title: "Game Plugin List Path", fileTypes: ["txt"], required: true },
        { formId: "configFilePath", title: "Game Config Files Directory", required: !!formModel.manageConfigFiles },
        { formId: "saveFolderPath", title: "Game Saves Directory", required: !!formModel.manageSaveFiles }
    ];
}

@Pipe({
    name: "appProfileSettingsStandardPathFields"
})
export class AppProfileSettingsStandardPathFieldsPipe implements PipeTransform {

    public transform(formModel: Partial<AppProfile.Form>, baseProfileMode: boolean): Readonly<DefaultProfilePathFieldEntry[]> {
        let result: DefaultProfilePathFieldEntry[] = [];

        if (!baseProfileMode) {
            result = result.concat(STANDARD_FIELDS(formModel));
        }

        result = result.concat(PROFILE_OVERRIDE_FIELDS(formModel));
        return result;
    }
}
