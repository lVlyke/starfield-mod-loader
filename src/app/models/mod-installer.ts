import { Fomod } from "./fomod";

export interface ModInstaller {
    config?: ModInstaller.ModuleConfig;
    info?: ModInstaller.ModuleInfo;
    zeroConfig: boolean;
}

export namespace ModInstaller {

    export type Order = Fomod.Order;
    export const Order = Fomod.Order;
    export type Image = Fomod.Image;
    export type HeaderImage = Fomod.HeaderImage;
    export type DependencyState = Fomod.DependencyState;
    export const DependencyState = Fomod.DependencyState;
    export type ModuleTitle = Fomod.ModuleTitle;
    export type CompositeDependency = Fomod.CompositeDependency;
    export type FileList = Fomod.FileList;
    export type FileSystemItem = Fomod.FileSystemItem;
    export type FileDependency = Fomod.FileDependency;
    export type InstallStep = Fomod.InstallStep;

    export namespace InstallStep {

        export type List = Fomod.InstallStep.List;
    }

    export type PluginGroup = Fomod.PluginGroup;

    export namespace PluginGroup {

        export type Type = Fomod.PluginGroup.Type;
        export const Type = Fomod.PluginGroup.Type;
    }

    export type Plugin = Fomod.Plugin;
    export type PluginType = Fomod.PluginType;
    
    export namespace PluginType {

        export type Name = Fomod.PluginType.Name;
        export const Name = Fomod.PluginType.Name;
    }

    export namespace ConditionalFileInstall {

        export type List = Fomod.ConditionalFileInstall.List;
    }

    export namespace CompositeDependency {

        export type Operator = Fomod.CompositeDependency.Operator;
        export const Operator = Fomod.CompositeDependency.Operator;
    }

    //

    export interface ModuleConfig {
        moduleName: ModuleTitle;
        moduleDependencies: CompositeDependency[];
        requiredInstallFiles: FileList[];
        installSteps?: InstallStep.List;
        conditionalFileInstalls?: ConditionalFileInstall.List;
        moduleImage?: HeaderImage;
    }
    
    export interface ModuleInfo {
        name?: string;
        author?: string[];
        version?: string;
        description?: string;
        website?: string;
        id?: string;
        categoryId?: string[];
    }
}