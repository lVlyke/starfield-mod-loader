import { Pipe, PipeTransform } from "@angular/core";
import { NgForm } from "@angular/forms";
import { AppProfile } from "../../models/app-profile";

export interface DefaultProfilePathField {
    formId: keyof AppProfile;
    title: string;
    required: boolean;
    path: boolean;
    fileTypes?: string[];
    linkable?: boolean;
    linked?: boolean;
    linkFn?: (field: DefaultProfilePathField) => void;
}

export interface DefaultProfilePathFieldGroup {
    formId: string;
    groupTitle: string;
    fields: DefaultProfilePathField[];
    hint?: string;
}

export type DefaultProfilePathFieldEntry = DefaultProfilePathField | DefaultProfilePathFieldGroup;

function PROFILE_OVERRIDE_FIELDS({}: AppProfileSettingsStandardPathFieldsPipe.Options): Readonly<DefaultProfilePathFieldEntry[]> {
    return [
        { formId: "profilePathOverrides", groupTitle: "Profile Path Overrides", hint: "Override standard profile paths", fields: [
            { formId: "rootPathOverride", title: "Profile Root Path", path: true, required: false },
            { formId: "modsPathOverride", title: "Profile Mods Path", path: true, required: false },
            { formId: "savesPathOverride", title: "Profile Saves Path", path: true, required: false },
            { formId: "configPathOverride", title: "Profile Config Path", path: true, required: false },
            { formId: "backupsPathOverride", title: "Profile Backups Path", path: true, required: false },
        ] }
    ];
}

function STANDARD_FIELDS({
    formModel,
    form,
    modLinkModeSupported,
    configLinkModeSupported
}: AppProfileSettingsStandardPathFieldsPipe.Options): Readonly<DefaultProfilePathFieldEntry[]> {
    return [
        {
            formId: "gameRootDir",
            title: "Game Root Directory",
            path: true, 
            required: true,
            linkable: true,
            linked: formModel.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!formModel.modLinkMode);
            } : undefined
        },
        {
            formId: "gameModDir",
            title: "Game Data Directory",
            path: true, 
            required: true,
            linkable: true,
            linked: formModel.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!formModel.modLinkMode);
            } : undefined
        },
        {
            formId: "gameBinaryPath",
            title: "Game Executable",
            fileTypes: ["exe", "bat", "cmd", "lnk", "sh"],
            path: true, 
            required: true
        },
        { 
            formId: "gamePluginListPath",
            title: "Game Plugin List Path",
            fileTypes: ["txt"],
            path: true, 
            required: true
        },
        {
            formId: "gameConfigFilePath",
            title: "Game Config Files Directory",
            path: true, 
            required: !!formModel.manageConfigFiles,
            linkable: formModel.manageConfigFiles,
            linked: formModel.configLinkMode,
            linkFn: configLinkModeSupported ? () => {
                form.controls["configLinkMode"].setValue(!formModel.configLinkMode);
            } : undefined
        },
        {
            formId: "gameSaveFolderPath",
            title: "Game Saves Directory",
            path: true, 
            required: !!formModel.manageSaveFiles,
            linkable: formModel.manageSaveFiles,
            linked: true
        },
        {
            formId: "steamGameId",
            title: "Custom Steam Game ID",
            path: false,
            required: !!formModel.manageSteamCompatSymlinks,
            hint: "The ID of a custom Steam game entry (i.e. for script extenders)."
        }
    ];
}

@Pipe({
    name: "appProfileSettingsStandardPathFields",
    standalone: false
})
export class AppProfileSettingsStandardPathFieldsPipe implements PipeTransform {

    public transform(options: AppProfileSettingsStandardPathFieldsPipe.Options): Readonly<DefaultProfilePathFieldEntry[]> {
        let result: DefaultProfilePathFieldEntry[] = [];

        if (!options.baseProfileMode) {
            result = result.concat(STANDARD_FIELDS(options));
        }

        result = result.concat(PROFILE_OVERRIDE_FIELDS(options));
        return result;
    }
}

export namespace AppProfileSettingsStandardPathFieldsPipe {

    export interface Options {
        baseProfileMode: boolean;
        formModel: Partial<AppProfile.Form>;
        form: NgForm;
        modLinkModeSupported: boolean;
        configLinkModeSupported: boolean;
    }
}
