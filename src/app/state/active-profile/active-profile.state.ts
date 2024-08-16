import _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";
import { ActiveProfileActions } from "./active-profile.actions";
import { ProfileUtils } from "../../util/profile-utils";
import { GamePluginProfileRef } from "../../models/game-plugin-profile-ref";
import { RelativeOrderedMap } from "../../util/relative-ordered-map";

@State<ActiveProfileState.Model>({
    name: "activeProfile",
    defaults: null,
    children: []
})
@Injectable()
export class ActiveProfileState {

    @Selector()
    public static getExternalFilesCache(state: ActiveProfileState.Model): AppProfile.ExternalFiles | undefined {
        return state?.externalFilesCache;
    }

    @Selector()
    public static getPlugins(state: ActiveProfileState.Model): GamePluginProfileRef[] | undefined {
        return state?.plugins;
    }

    @Selector()
    public static isDeployed(state: ActiveProfileState.Model): boolean {
        return !!state?.deployed;
    }

    @Selector()
    public static isManageConfigFiles(state: ActiveProfileState.Model): boolean {
        return !!state?.manageConfigFiles;
    }

    @Action(ActiveProfileActions.AddMod)
    public addMod(context: ActiveProfileState.Context, { root, name, mod }: ActiveProfileActions.AddMod): void {
        const state = _.cloneDeep(context.getState()!);

        if (root) {
            RelativeOrderedMap.insert(state.rootMods, name, mod);
        } else{
            RelativeOrderedMap.insert(state.mods, name, mod);
        }
        
        context.setState(state);
    }

    @Action(ActiveProfileActions.DeleteMod)
    public deleteMod(context: ActiveProfileState.Context, { root, name }: ActiveProfileActions.DeleteMod): void {
        const state = _.cloneDeep(context.getState()!);

        if (root) {
            RelativeOrderedMap.erase(state.rootMods, name);
        } else {
            RelativeOrderedMap.erase(state.mods, name);
        }

        context.setState(state);
    }

    @Action(ActiveProfileActions.RenameMod)
    public renameMod(context: ActiveProfileState.Context, { root, curName, newName }: ActiveProfileActions.RenameMod): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = root ? state.rootMods : state.mods;

        RelativeOrderedMap.forEach(modList, (mod, modName) => {
            RelativeOrderedMap.erase(modList, modName);

            if (mod) {
                // Rename the selected mod, preserving the prior load order
                RelativeOrderedMap.insert(modList, modName === curName ? newName : modName, mod);
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
            const mod = RelativeOrderedMap.get(modList, modName);

            RelativeOrderedMap.erase(modList, modName);

            if (mod) {
                RelativeOrderedMap.insert(modList, modName, mod);
            }
        });

        context.setState(state);
    }

    @Action(ActiveProfileActions.ReconcileModList)
    public reconcileModList(
        context: ActiveProfileState.Context,
        { mods }: ActiveProfileActions.ReconcileModList
    ): void {
        const MOD_LIST_KEYS = ["rootMods", "mods"] as const;
        const state = _.cloneDeep(context.getState()!);

        if (!!state.baseProfile) {
            MOD_LIST_KEYS.forEach((listKey) => {
                const profileMods = state[listKey];
                const baseProfileMods = state.baseProfile![listKey] ?? [];
                // Start with a copy of the base profile's mod list
                const mergedProfileMods: AppProfile.ModList = baseProfileMods.map(([modName, modRef]) => [modName, {
                    ...modRef,
                    baseProfile: state.baseProfile!.name
                }]);

                // Merge this profile's mods in relative to their previous order
                RelativeOrderedMap.forEach(profileMods, (existingMod, existingModName, existingModIndex) => {
                    if (!existingMod.baseProfile) {
                        if (existingModIndex === 0) {
                            RelativeOrderedMap.insertAt(mergedProfileMods, existingModName, existingMod, 0);
                        } else if (existingModIndex === profileMods.length - 1) {
                            RelativeOrderedMap.insert(mergedProfileMods, existingModName, existingMod);
                        } else {
                            const lastMod = RelativeOrderedMap.previous(profileMods, existingModName);
                            if (lastMod && RelativeOrderedMap.has(mergedProfileMods, lastMod[0])) {
                                RelativeOrderedMap.insertAfter(mergedProfileMods, existingModName, existingMod, lastMod[0]);
                            } else {
                                const nextMod = RelativeOrderedMap.next(profileMods, existingModName);
                                if (nextMod && RelativeOrderedMap.has(mergedProfileMods, nextMod[0])) {
                                    RelativeOrderedMap.insertBefore(mergedProfileMods, existingModName, existingMod, nextMod[0]);
                                } else {
                                    RelativeOrderedMap.insert(mergedProfileMods, existingModName, existingMod);
                                }
                            }
                        }
                    }
                });

                state[listKey] = mergedProfileMods;
            });

            // Add missing profile mods (this shouldn't normally be needed unless someone added mods manually)
            RelativeOrderedMap.forEach(mods, (externalMod, externalModName) => {
                if (!RelativeOrderedMap.has(state.mods, externalModName)) {
                    // TODO - Warn user that this may have been a root mod and will be demoted
                    RelativeOrderedMap.insert(state.mods, externalModName, externalMod);
                }
            });
        }

        context.setState(state);
    }

    @Action(ActiveProfileActions.ReconcilePluginList)
    public reconcilePluginList(
        context: ActiveProfileState.Context,
        { plugins, pluginTypeOrder }: ActiveProfileActions.ReconcilePluginList
    ): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = RelativeOrderedMap.entries(state.mods);

        // TODO - Scan root mods?

        // NOTE: This function assumes mod list has already been reconciled

        // BC:<v0.4.0
        if (!state.plugins) {
            state.plugins = [];
        }

        // Calculate available external plugins
        const externalPlugins = (state.manageExternalPlugins && state.externalFilesCache) ? state.externalFilesCache.pluginFiles.map((externalPluginFile) => ({
            modId: undefined,
            plugin: externalPluginFile,
            enabled: true
        })) : [];

        // Remove deleted external plugins and add missing external plugins
        let orderedPlugins = state.plugins
            .filter(plugin => plugin.modId !== undefined || externalPlugins.some(externalPlugin => externalPlugin.plugin === plugin.plugin))
            .concat(externalPlugins.filter(externalPlugin => !state.plugins.some(plugin => plugin.plugin === externalPlugin.plugin)));

        // Preserve previous plugin order while using latest plugin data and add new plugins
        orderedPlugins = orderedPlugins
            .map(plugin => plugin.modId === undefined ? plugin : plugins.find(activePlugin => plugin.plugin === activePlugin.plugin))
            .filter((plugin): plugin is GamePluginProfileRef => !!plugin)
            .concat(plugins.filter(plugin => !orderedPlugins.some(activePlugin => plugin.plugin === activePlugin.plugin)));

        if (!!state.baseProfile) {
            const baseProfilePlugins = state.baseProfile.plugins ?? [];

            // Start with a copy of the base profile's plugins list
            let mergedPlugins = baseProfilePlugins.slice(0);

            // Add profile plugins
            orderedPlugins.forEach((activePlugin) => {
                const modEntry = activePlugin.modId !== undefined ? modList.find(([modId]) => activePlugin.modId === modId) : undefined;
                if (activePlugin.modId === undefined || (modEntry && !modEntry[1].baseProfile && modEntry[1].enabled)) {
                    const basePlugin = _.find(mergedPlugins, { plugin: activePlugin.plugin });

                    if (!basePlugin) {
                        // Add the missing plugin relative to its previous order
                        const oldPluginIndex = state.plugins.findIndex(oldPlugin => oldPlugin.plugin === activePlugin.plugin);
                        if (oldPluginIndex === 0) {
                            mergedPlugins = [activePlugin].concat(mergedPlugins);
                        } else if (oldPluginIndex === -1 || oldPluginIndex === state.plugins.length - 1) {
                            mergedPlugins.push(activePlugin);
                        } else {
                            const lastPlugin = state.plugins[oldPluginIndex - 1];
                            const lastPluginIndex = lastPlugin ? mergedPlugins.findIndex(plugin => plugin.plugin === lastPlugin.plugin) : -1;
                            if (lastPluginIndex !== -1) {
                                mergedPlugins.splice(lastPluginIndex + 1, 0, activePlugin);
                            } else {
                                const nextPlugin = state.plugins[oldPluginIndex + 1];
                                const nextPluginIndex = nextPlugin ? mergedPlugins.findIndex(plugin => plugin.plugin === nextPlugin.plugin) : -1;
                                if (nextPluginIndex !== -1) {
                                    mergedPlugins.splice(nextPluginIndex, 0, activePlugin);
                                } else {
                                    mergedPlugins.push(activePlugin);
                                }
                            }
                        }
                    } else if (activePlugin.modId !== undefined) {
                        // Update the modId of the plugin to the last mod in the load order
                        basePlugin.modId = activePlugin.modId;
                    }
                }
            });

            orderedPlugins = mergedPlugins;
        }

        // Remove duplicate plugins
        orderedPlugins = _.uniqBy(orderedPlugins, "plugin");

        // Sort plugins by type order (if required)
        if (pluginTypeOrder) {
            orderedPlugins = orderedPlugins.sort((aRef, bRef) => {
                const aIndex = ProfileUtils.getPluginTypeIndex(aRef, pluginTypeOrder!),
                      bIndex = ProfileUtils.getPluginTypeIndex(bRef, pluginTypeOrder!);

                if (aIndex !== undefined && bIndex !== undefined) {
                    return aIndex - bIndex;
                } else {
                    return 0;
                }
            });
        }

        state.plugins = orderedPlugins;
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

    @Action(ActiveProfileActions.setBaseProfile)
    public setBaseProfile(context: ActiveProfileState.Context, state: ActiveProfileActions.BaseProfileAction): void {
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
            const mod = RelativeOrderedMap.get(modList, modName);

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

    export type Model = AppProfile | null;

    export type Context = StateContext<Model>;
}