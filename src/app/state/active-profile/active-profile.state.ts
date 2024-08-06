import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";
import { ActiveProfileActions } from "./active-profile.actions";
import { ProfileUtils } from "../../util/profile-utils";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";

@State<AppProfile | null>({
    name: "activeProfile",
    defaults: null,
    children: []
})
@Injectable()
export class ActiveProfileState {

    @Selector()
    public static getExternalFilesCache(state: AppProfile): AppProfile.ExternalFiles | undefined {
        return state.externalFilesCache;
    }

    @Selector()
    public static getPlugins(state: AppProfile): GamePluginProfileRef[] | undefined {
        return state.plugins;
    }

    @Selector()
    public static isDeployed(state: AppProfile): boolean {
        return !!state.deployed;
    }

    @Selector()
    public static isManageConfigFiles(state: AppProfile): boolean {
        return !!state.manageConfigFiles;
    }

    @Action(ActiveProfileActions.AddMod)
    public addMod(context: ActiveProfileState.Context, { root, name, mod }: ActiveProfileActions.AddMod): void {
        const state = _.cloneDeep(context.getState()!);

        if (root) {
            state.rootMods.set(name, mod);
        } else{
            state.mods.set(name, mod);
        }
        
        context.setState(state);
    }

    @Action(ActiveProfileActions.DeleteMod)
    public deleteMod(context: ActiveProfileState.Context, { root, name }: ActiveProfileActions.DeleteMod): void {
        const state = _.cloneDeep(context.getState()!);

        if (root) {
            state.rootMods.delete(name);
        } else {
            state.mods.delete(name);
        }

        context.setState(state);
    }

    @Action(ActiveProfileActions.RenameMod)
    public renameMod(context: ActiveProfileState.Context, { root, curName, newName }: ActiveProfileActions.RenameMod): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = root ? state.rootMods : state.mods;

        Array.from(modList.entries()).forEach(([modName, mod]) => {
            modList.delete(modName);

            if (mod) {
                // Rename the selected mod, preserving the prior load order
                modList.set(modName === curName ? newName : modName, mod);
            }
        });

        context.setState(state);
    }

    @Action(ActiveProfileActions.UpdateModVerification)
    public updateModVerification(
        context: ActiveProfileState.Context,
        { root, modName, verificationResult }: ActiveProfileActions.UpdateModVerification
    ): void {
        this._updateModVerifications(context, root, { [modName]: verificationResult });
    }

    @Action(ActiveProfileActions.UpdateModVerifications)
    public updateModVerifications(
        context: ActiveProfileState.Context,
        { root, modVerificationResults }: ActiveProfileActions.UpdateModVerifications
    ): void {
        this._updateModVerifications(context, root, modVerificationResults.results);
    }

    @Action(ActiveProfileActions.UpdateExternalFiles)
    public updateExternalFilesCache(
        context: ActiveProfileState.Context,
        state: ActiveProfileActions.UpdateExternalFiles
    ): void {
        context.patchState(state);
    }

    @Action(ActiveProfileActions.ReorderMods)
    public reorderMods(context: ActiveProfileState.Context, { root, modOrder }: ActiveProfileActions.ReorderMods): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = root ? state.rootMods : state.mods;

        modOrder.forEach((modName) => {
            const mod = modList.get(modName);

            modList.delete(modName);

            if (mod) {
                modList.set(modName, mod);
            }
        });

        context.setState(state);
    }

    @Action(ActiveProfileActions.ReconcilePluginList)
    public reconcilePluginList(
        context: ActiveProfileState.Context,
        { plugins, pluginTypeOrder }: ActiveProfileActions.ReconcilePluginList): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = Array.from(state.mods.entries());

        // BC:<v0.4.0
        if (!state.plugins) {
            state.plugins = [];
        }

        // Add missing plugins
        plugins.forEach((activePlugin) => {
            const modEntry = modList.find(([modId]) => activePlugin.modId === modId);

            if (modEntry?.[1].enabled) {
                const existingPlugin = _.find(state.plugins, { plugin: activePlugin.plugin });

                if (!existingPlugin) {
                    // Add a new plugin entry
                    state.plugins.push(activePlugin);
                } else {
                    // Update the modId of the plugin to the last mod in the load order
                    existingPlugin.modId = activePlugin.modId;
                }
            }
        });

        // Remove deleted plugins
        state.plugins = state.plugins.filter((existingPlugin) => {
            if (existingPlugin.modId) {
                const modEntry = modList.find(([modId]) => existingPlugin.modId === modId);
                const activePlugin = _.find(plugins, { plugin: existingPlugin.plugin });

                return modEntry?.[1].enabled && !!activePlugin;
            } else {
                // Only allow external mods if `manageExternalPlugins` is true
                if (!state.manageExternalPlugins) {
                    return false;
                }

                // Check if external plugin file still exists
                return state.externalFilesCache?.pluginFiles.includes(existingPlugin.plugin);
            }
        });

        let processedPlugins: GamePluginProfileRef[] = [];

        // Add missing external plugins
        if (state.manageExternalPlugins) {
            state.externalFilesCache?.pluginFiles.forEach((externalPluginFile) => {
                if (!_.find(state.plugins, plugin => plugin.plugin === externalPluginFile)) {
                    processedPlugins.push({ modId: undefined, plugin: externalPluginFile, enabled: true });
                }
            });
        }

        processedPlugins = processedPlugins.concat(state.plugins);

        // Remove duplicate plugins
        processedPlugins = _.uniqBy(processedPlugins, "plugin");

        // Sort plugins by type order (if required)
        if (pluginTypeOrder) {
            processedPlugins = processedPlugins.sort((aRef, bRef) => {
                const aIndex = ProfileUtils.getPluginTypeIndex(aRef, pluginTypeOrder!),
                      bIndex = ProfileUtils.getPluginTypeIndex(bRef, pluginTypeOrder!);

                if (aIndex !== undefined && bIndex !== undefined) {
                    return aIndex - bIndex;
                } else {
                    return 0;
                }
            });
        }

        state.plugins = processedPlugins;
        context.setState(state);
    }

    @Action(ActiveProfileActions.UpdatePlugins)
    public updatePlugins(context: ActiveProfileState.Context, state: ActiveProfileActions.UpdatePlugins): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(ActiveProfileActions.UpdatePlugin)
    public updatePlugin(context: ActiveProfileState.Context, { plugin }: ActiveProfileActions.UpdatePlugin): void {
        const state = _.cloneDeep(context.getState()!);

        const existingPlugin = state.plugins.find((curPlugin) => curPlugin.plugin === plugin.plugin);
        if (existingPlugin) {
            Object.assign(existingPlugin, plugin);
        } else {
            state.plugins.push(plugin);
        }

        context.setState(state);
    }

    @Action(ActiveProfileActions.setDeployed)
    public setDeployed(context: ActiveProfileState.Context, state: ActiveProfileActions.DeployedAction): void {
        context.patchState(state);
    }

    @Action(ActiveProfileActions.setPluginListPath)
    public setPluginListPath(context: ActiveProfileState.Context, state: ActiveProfileActions.PluginListPathAction): void {
        context.patchState(state);
    }

    @Action(ActiveProfileActions.manageExternalPlugins)
    public manageExternalPlugins(context: ActiveProfileState.Context, state: ActiveProfileActions.ManageExternalPluginsAction): void {
        context.patchState(state);
    }

    private _updateModVerifications(
        context: ActiveProfileState.Context,
        root: boolean,
        modVerificationResults: Record<string, AppProfile.VerificationResult | undefined>
    ): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = root ? state.rootMods : state.mods;

        Object.entries(modVerificationResults).forEach(([modName, verificationResult]) => {
            const mod = modList.get(modName);

            if (!!mod) {
                if (verificationResult?.error) {
                    mod.verificationError = verificationResult;
                } else {
                    delete mod.verificationError;
                }
            }
        });

        context.setState(state);
    }
}

export namespace ActiveProfileState {

    export type Context = StateContext<AppProfile | null>;
}