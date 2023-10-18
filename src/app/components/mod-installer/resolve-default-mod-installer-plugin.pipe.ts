import { Pipe, PipeTransform } from "@angular/core";
import { AppModInstaller } from "./mod-installer.types";
import { ModInstaller } from "../../models/mod-installer";

@Pipe({
    name: "appResolveDefaultModInstallerPlugin"
})
export class AppResolveDefaultModInstallerPluginPipe implements PipeTransform {

    public transform(pluginGroup: AppModInstaller.PluginGroup): AppModInstaller.Plugin | undefined {
        const plugins = pluginGroup.plugins;
        let plugin: AppModInstaller.Plugin | undefined;

        plugin = plugins.find(plugin => plugin.pluginInfo.typeDescriptor[0].type[0].name[0] === ModInstaller.PluginType.Name.Required);
        
        if (!plugin) {
            plugin = plugins.find(plugin => plugin.pluginInfo.typeDescriptor[0].type[0].name[0] === ModInstaller.PluginType.Name.Recommended);
        }

        if (!plugin) {
            plugin = plugins[0];
        }

        return plugin;
    }
}
