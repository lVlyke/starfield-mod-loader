import * as _ from "lodash";
import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { patch } from "@ngxs/store/operators";
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
    public updateActiveProfile(context: ActiveProfileState.Context, { name, mod }: ActiveProfileActions.AddMod): void {
        context.setState(patch({
            mods: patch({ [name]: _.cloneDeep(mod) })
        }));
    }
}

export namespace ActiveProfileState {

    export type Context = StateContext<AppProfile | {}>;
}