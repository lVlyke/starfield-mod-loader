import { Pipe, PipeTransform } from "@angular/core";
import { AppModInstaller } from "./mod-installer.types";
import { ModInstaller } from "../../models/mod-installer";

@Pipe({
    name: "appResolveDefaultModInstallerPlugin",
    standalone: false
})
export class AppResolveDefaultModInstallerPluginPipe implements PipeTransform {

    public transform(pluginGroup: AppModInstaller.PluginGroup): AppModInstaller.Plugin | undefined {
        const plugins = pluginGroup.plugins;
        let plugin: AppModInstaller.Plugin | undefined;

        plugin = plugins.find(plugin => plugin.type === ModInstaller.PluginType.Name.Required);
        
        if (!plugin) {
            plugin = plugins.find(plugin => plugin.type === ModInstaller.PluginType.Name.Recommended);
        }

        if (!plugin) {
            plugin = plugins[0];
        }

        return plugin;
    }
}
