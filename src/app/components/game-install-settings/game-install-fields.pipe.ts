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
            linkable: !!profileModel,
            linked: profileModel?.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!profileModel!.modLinkMode);
            } : undefined
        },
        {
            formId: "modDir",
            title: "Game Data Directory",
            path: true,
            readonly: !custom,
            required: true,
            linkable: !!profileModel,
            linked: profileModel?.modLinkMode,
            linkFn: modLinkModeSupported ? () => {
                form.controls["modLinkMode"].setValue(!profileModel!.modLinkMode);
            } : undefined
        },
        {
            formId: "configFilePath",
            title: "Game Config Files Directory",
            path: true, 
            readonly: !custom,
            required: !!profileModel?.manageConfigFiles,
            linkable: profileModel?.manageConfigFiles,
            linked: profileModel?.configLinkMode,
            linkFn: configLinkModeSupported ? () => {
                form.controls["configLinkMode"].setValue(!profileModel!.configLinkMode);
            } : undefined
        },
        {
            formId: "saveFolderPath",
            title: "Game Saves Directory",
            path: true,
            readonly: !custom,
            required: !!profileModel?.manageSaveFiles,
            linkable: profileModel?.manageSaveFiles,
            linked: true
        },
        ...(!!GameDetails.hasPluginListPath(gameDetails) || !profileModel) ? [{ 
            formId: "pluginListPath",
            title: "Game Plugin List Path",
            fileTypes: ["txt"],
            path: true,
            readonly: !custom,
            required: !!profileModel
        } as GameInstallFormField] : [],
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
