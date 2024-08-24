import { Pipe, PipeTransform } from "@angular/core";
import { NgForm } from "@angular/forms";
import { AppProfile } from "../../models/app-profile";

export interface DefaultProfilePathField {
    formId: keyof AppProfile.DefaultablePaths;
    title: string;
    required: boolean;
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
            { formId: "rootPathOverride", title: "Profile Root Path", required: false },
            { formId: "modsPathOverride", title: "Profile Mods Path", required: false },
            { formId: "savesPathOverride", title: "Profile Saves Path", required: false },
            { formId: "configPathOverride", title: "Profile Config Path", required: false },
            { formId: "backupsPathOverride", title: "Profile Backups Path", required: false },
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
            formId: "gameModDir",
            title: "Game Data Directory",
            required: true,
            linkable: true,
            linked: formModel.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!formModel.modLinkMode);
            } : undefined
        },
        {
            formId: "gameRootDir",
            title: "Game Root Directory",
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
            required: true
        },
        { 
            formId: "gamePluginListPath",
            title: "Game Plugin List Path",
            fileTypes: ["txt"],
            required: true
        },
        {
            formId: "gameConfigFilePath",
            title: "Game Config Files Directory",
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
            required: !!formModel.manageSaveFiles,
            linkable: formModel.manageSaveFiles,
            linked: true
        }
    ];
}

@Pipe({
    name: "appProfileSettingsStandardPathFields"
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
