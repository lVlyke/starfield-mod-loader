import { Pipe, PipeTransform } from "@angular/core";
import {
    AppProfileFormField,
    AppProfileFormFieldEntry,
    AppProfileFormFieldGroup,
    AppProfileFormFieldInput
} from "../../models/app-profile-form-field";
import { GameInstallation } from "../../models/game-installation";
import { GameDetails } from "../../models/game-details";

export type GameInstallFormField = AppProfileFormField<GameInstallation>;
export type GameInstallFormFieldGroup = AppProfileFormFieldGroup<GameInstallation, keyof GameInstallation>;
export type GameInstallFormFieldEntry = AppProfileFormFieldEntry<GameInstallation, keyof GameInstallation>;

export interface GameInstallFormFieldInput extends AppProfileFormFieldInput {
    custom: boolean;
}

function GAME_INSTALLATION_FIELDS({
    gameDetails,
    profileModel,
    form,
    modLinkModeSupported,
    configLinkModeSupported,
    custom
}: GameInstallFormFieldInput): GameInstallFormField[] {
    return [
        {
            formId: "rootDir",
            title: "Game Root Directory",
            path: true,
            readonly: !custom,
            required: true,
            linkable: true,
            linked: profileModel.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!profileModel.modLinkMode);
            } : undefined
        },
        {
            formId: "modDir",
            title: "Game Data Directory",
            path: true,
            readonly: !custom,
            required: true,
            linkable: true,
            linked: profileModel.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!profileModel.modLinkMode);
            } : undefined
        },
        ...!!GameDetails.hasPluginListPath(gameDetails) ? [{ 
            formId: "pluginListPath",
            title: "Game Plugin List Path",
            fileTypes: ["txt"],
            path: true,
            readonly: !custom,
            required: true
        } as GameInstallFormField] : [],
        {
            formId: "configFilePath",
            title: "Game Config Files Directory",
            path: true, 
            readonly: !custom,
            required: !!profileModel.manageConfigFiles,
            linkable: profileModel.manageConfigFiles,
            linked: profileModel.configLinkMode,
            linkFn: configLinkModeSupported ? () => {
                form.controls["configLinkMode"].setValue(!profileModel.configLinkMode);
            } : undefined
        },
        {
            formId: "saveFolderPath",
            title: "Game Saves Directory",
            path: true,
            readonly: !custom,
            required: !!profileModel.manageSaveFiles,
            linkable: profileModel.manageSaveFiles,
            linked: true
        }
    ];
}

@Pipe({ name: "appGameInstallFields" })
export class AppGameInstallFieldsPipe implements PipeTransform {

    public transform(input: AppProfileFormFieldInput | null | undefined, custom: boolean): Readonly<GameInstallFormField[]> {
        if (!input) {
            return [];
        }

        return GAME_INSTALLATION_FIELDS({ custom, ...input });
    }
}
