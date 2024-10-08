import { Pipe, PipeTransform } from "@angular/core";
import { AppProfile } from "../../models/app-profile";

export interface DefaultProfilePathField {
    formId: keyof AppProfile.DefaultablePaths,
    title: string,
    fileTypes?: string[]
}

const STANDARD_PATH_FIELDS: Readonly<DefaultProfilePathField[]> = [
    { formId: "modBaseDir", title: "Mod Base Directory" },
    { formId: "gameBaseDir", title: "Game Base Directory" },
    { formId: "gameBinaryPath", title: "Game Executable", fileTypes: ["exe", "bat", "cmd", "lnk", "sh"] },
    { formId: "pluginListPath", title: "Plugin List Path", fileTypes: ["txt"] }
];
const CONFIG_FILE_PATH_FIELD: DefaultProfilePathField = { formId: "configFilePath", title: "Config Files Directory" };

@Pipe({
    name: "appProfileSettingsStandardPathFields"
})
export class AppProfileSettingsStandardPathFieldsPipe implements PipeTransform {

    public transform(formModel?: Partial<AppProfile> | null): Readonly<DefaultProfilePathField[]> {
        let result = STANDARD_PATH_FIELDS;

        if (formModel?.manageConfigFiles) {
            result = result.concat([CONFIG_FILE_PATH_FIELD]);
        }

        return result;
    }
}
