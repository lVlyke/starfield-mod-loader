import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";
import { ActiveProfileActions } from "./active-profile.actions";
import { ProfileUtils } from "../../util/profile-utils";

@State<AppProfile | null>({
    name: "activeProfile",
    defaults: null,
    children: []
})
@Injectable()
export class ActiveProfileState {

    @Selector()
    public static getManualMods(state: AppProfile): string[] {
        return state.manualMods ?? [];
    }

    @Selector()
    public static isDeployed(state: AppProfile): boolean {
        return !!state.deployed;
    }

    @Action(ActiveProfileActions.AddMod)
    public addMod(context: ActiveProfileState.Context, { name, mod }: ActiveProfileActions.AddMod): void {
        const state = _.cloneDeep(context.getState()!);

        state.mods.set(name, mod);
        context.setState(state);
    }

    @Action(ActiveProfileActions.DeleteMod)
    public deleteMod(context: ActiveProfileState.Context, { name }: ActiveProfileActions.DeleteMod): void {
        const state = _.cloneDeep(context.getState()!);

        state.mods.delete(name);
        context.setState(state);
    }

    @Action(ActiveProfileActions.RenameMod)
    public renameMod(context: ActiveProfileState.Context, { curName, newName }: ActiveProfileActions.RenameMod): void {
        const state = _.cloneDeep(context.getState()!);

        Array.from(state.mods.entries()).forEach(([modName, mod]) => {
            state.mods.delete(modName);

            if (mod) {
                // Rename the selected mod, preserving the prior load order
                state.mods.set(modName === curName ? newName : modName, mod);
            }
        });

        context.setState(state);
    }

    @Action(ActiveProfileActions.UpdateModVerification)
    public updateModVerification(
        context: ActiveProfileState.Context,
        { modName, verificationResult }: ActiveProfileActions.UpdateModVerification
    ): void {
        this._updateModVerifications(context, { [modName]: verificationResult });
    }

    @Action(ActiveProfileActions.UpdateModVerifications)
    public updateModVerifications(
        context: ActiveProfileState.Context,
        { modVerificationResults }: ActiveProfileActions.UpdateModVerifications
    ): void {
        this._updateModVerifications(context, modVerificationResults);
    }

    @Action(ActiveProfileActions.UpdateManualMods)
    public updateManualMods(
        context: ActiveProfileState.Context,
        state: ActiveProfileActions.UpdateManualMods
    ): void {
        context.patchState(state);
    }

    @Action(ActiveProfileActions.ReorderMods)
    public reorderMods(context: ActiveProfileState.Context, { modOrder }: ActiveProfileActions.ReorderMods): void {
        const state = _.cloneDeep(context.getState()!);

        modOrder.forEach((modName) => {
            const mod = state.mods.get(modName);

            state.mods.delete(modName);

            if (mod) {
                state.mods.set(modName, mod);
            }
        });

        context.setState(state);
    }

    @Action(ActiveProfileActions.ReconcilePluginList)
    public reconcilePluginList(context: ActiveProfileState.Context, { pluginTypeOrder }: ActiveProfileActions.ReconcilePluginList): void {
        const state = _.cloneDeep(context.getState()!);
        const modList = Array.from(state.mods.entries());

        // BC:<v0.4.0
        if (!state.plugins) {
            state.plugins = [];
        }

        // Add missing plugins
        modList.forEach(([modId, { enabled, plugins }]) => plugins?.forEach((plugin) => {
            if (enabled) {
                const existingPlugin = _.find(state.plugins, { plugin });

                if (!existingPlugin) {
                    // Add a new plugin entry
                    state.plugins.push({ modId, plugin, enabled: true });
                } else {
                    // Update the modId of the plugin to the last mod in the load order
                    existingPlugin.modId = modId;
                }
            }
        }));

        // Remove deleted plugins
        state.plugins = state.plugins.filter((pluginRef) => {
            return modList.find(([modId, { enabled, plugins }]) => pluginRef.modId === modId && enabled && plugins?.includes(pluginRef.plugin));
        });

        // Sort plugins by type order (if required)
        if (pluginTypeOrder) {
            state.plugins = state.plugins.sort((aRef, bRef) => {
                const aIndex = ProfileUtils.getPluginTypeIndex(aRef, pluginTypeOrder!),
                      bIndex = ProfileUtils.getPluginTypeIndex(bRef, pluginTypeOrder!);

                if (aIndex !== undefined && bIndex !== undefined) {
                    return aIndex - bIndex;
                } else {
                    return 0;
                }
            });
        }

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

    private _updateModVerifications(
        context: ActiveProfileState.Context,
        modVerificationResults: Record<string, AppProfile.ModVerificationResult | undefined>
    ): void {
        const state = _.cloneDeep(context.getState()!);

        Object.entries(modVerificationResults).forEach(([modName, verificationResult]) => {
            const mod = state.mods.get(modName);

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