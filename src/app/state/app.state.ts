import * as _ from "lodash";
import { AppData } from "../models/app-data";
import { Injectable } from "@angular/core";
import { State, Selector, Action, StateContext } from "@ngxs/store";
import { append, patch } from "@ngxs/store/operators";
import { AppActions } from "./app.actions";
import { AppProfile } from "../models/app-profile";
import { ActiveProfileState } from "./active-profile/active-profile.state";
import { AppTheme } from "../models/app-theme";

@State<AppData>({
    name: "app",
    defaults: {
        profileNames: [],
        theme: AppTheme.Dark,
        modsActivated: false,
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
    public static getTheme(state: AppData): AppTheme {
        return state.theme;
    }

    @Selector()
    public static isModsActivated(state: AppData): boolean {
        return state.modsActivated;
    }

    @Selector()
    public static isDeployInProgress(state: AppData): boolean {
        return !!state.deployInProgress;
    }

    @Action(AppActions.UpdateSettings)
    public updateSettings(context: AppState.Context, { settings }: AppActions.UpdateSettings): void {
        context.patchState(settings);
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

    @Action(AppActions.setDeployInProgress)
    public setDeployInProgress(context: AppState.Context, state: AppActions.DeployInProgressAction): void {
        context.patchState(_.cloneDeep(state));
    }
}

export namespace AppState {

    export type Context = StateContext<AppData>;
}
