import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";
import { ActiveProfileActions } from "./active-profile.actions";

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

        const mod = state.mods.get(curName);

        if (!!mod) {
            state.mods.delete(curName);
            state.mods.set(newName, mod);
        }

        context.setState(state);
    }

    @Action(ActiveProfileActions.UpdateModVerification)
    public updateModVerification(
        context: ActiveProfileState.Context,
        { modName, verificationResult }: ActiveProfileActions.UpdateModVerification
    ): void {
        const state = _.cloneDeep(context.getState()!);

        const mod = state.mods.get(modName);

        if (!!mod) {
            mod.verificationError = verificationResult?.error ? verificationResult : undefined;
        }

        context.setState(state);
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
}

export namespace ActiveProfileState {

    export type Context = StateContext<AppProfile | null>;
}