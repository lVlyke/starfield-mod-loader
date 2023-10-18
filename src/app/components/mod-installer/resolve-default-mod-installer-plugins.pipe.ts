import { Pipe, PipeTransform } from "@angular/core";
import { AppModInstaller } from "./mod-installer.types";
import { ModInstaller } from "../../models/mod-installer";

@Pipe({
    name: "appResolveDefaultModInstallerPlugins"
})
export class AppResolveDefaultModInstallerPluginsPipe implements PipeTransform {

    public transform(pluginGroup: AppModInstaller.PluginGroup): AppModInstaller.Plugin[] {
        return pluginGroup.plugins.filter((plugin) => [
            ModInstaller.PluginType.Name.Required,
            ModInstaller.PluginType.Name.Recommended
        ].includes(plugin.pluginInfo.typeDescriptor[0].type[0].name[0]));
    }
}
