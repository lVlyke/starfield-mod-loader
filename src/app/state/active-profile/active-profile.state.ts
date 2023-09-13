import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { AppProfile } from "../../models/app-profile";
import { ActiveProfileActions } from "./active-profile.actions";

@State<AppProfile | null>({
    name: "activeProfile",
    defaults: null,
    children: []
})
@Injectable()
export class ActiveProfileState {

    @Action(ActiveProfileActions.AddMod)
    public addMod(context: ActiveProfileState.Context, { name, mod }: ActiveProfileActions.AddMod): void {
        const state = _.cloneDeep(context.getState()!);

        state.mods.set(name, mod);
        context.setState(state);
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