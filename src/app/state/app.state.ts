import * as _ from "lodash";
import { AppData } from "../models/app-data";
import { Injectable } from "@angular/core";
import { State, Selector, Action, StateContext } from "@ngxs/store";
import { append, patch } from "@ngxs/store/operators";
import { AppActions } from "./app.actions";
import { AppProfile } from "../models/app-profile";
import { ActiveProfileState } from "./active-profile/active-profile.state";


@State<AppData>({
    name: "app",
    defaults: {
        profileNames: [],
        modsActivated: false
    },
    children: [ActiveProfileState]
})
@Injectable()
export class AppState {

    @Selector()
    public static getProfileNames(state: AppData): string[] {
        return state.profileNames;
    }
    
    @Selector()
    public static getActiveProfile(state: AppData): AppProfile | undefined {
        return state.activeProfile;
    }

    @Selector()
    public static isModsActivated(state: AppData): boolean {
        return state.modsActivated;
    }

    @Action(AppActions.SetProfiles)
    public setProfiles(context: AppState.Context, { profileNames }: AppActions.SetProfiles): void {
        context.setState(patch({
            profileNames
        }));
    }

    @Action(AppActions.AddProfile)
    public addProfile(context: AppState.Context, { profile }: AppActions.AddProfile): void {
        context.setState(patch({
            profileNames: append([profile.name])
        }));
    }

    @Action(AppActions.updateActiveProfile)
    public updateActiveProfile(context: AppState.Context, state: AppActions.ActiveProfileAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.activateMods)
    public activateMods(context: AppState.Context, state: AppActions.ModsActivatedAction): void {
        context.patchState(_.cloneDeep(state));
    }
}

export namespace AppState {

    export type Context = StateContext<AppData>;
}
