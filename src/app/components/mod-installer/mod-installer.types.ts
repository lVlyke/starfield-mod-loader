import { ModInstaller } from "../../models/mod-installer";

export namespace AppModInstaller {

    export type Flags = Record<string, ModInstaller.DependencyState | boolean>;

    export interface Flag {
        name: string;
        value?: ModInstaller.DependencyState;
    }

    export interface Plugin {
        pluginInfo: ModInstaller.Plugin;
        pluginGroup: ModInstaller.PluginGroup;
        name: string;
        type: ModInstaller.PluginType.Name;
        flags: Flag[];
        description?: string;
        image?: ModInstaller.Image;
    }
    
    export interface PluginGroup {
        pluginGroupInfo: ModInstaller.PluginGroup;
        name: string;
        type: ModInstaller.PluginGroup.Type;
        plugins: Plugin[];
    }
    
    export interface InstallStep {
        stepInfo: ModInstaller.InstallStep;
        name: string;
        pluginGroups: PluginGroup[];
    }
}
