import * as _ from "lodash";
import { AppData } from "../models/app-data";
import { Injectable } from "@angular/core";
import { State, Selector, Action, StateContext } from "@ngxs/store";
import { append, patch, removeItem } from "@ngxs/store/operators";
import { AppActions } from "./app.actions";
import { AppProfile } from "../models/app-profile";
import { ActiveProfileState } from "./active-profile/active-profile.state";
import { AppTheme } from "../models/app-theme";
import { GameDatabase } from "../models/game-database";

@State<AppData>({
    name: "app",
    defaults: {
        profileNames: [],
        theme: AppTheme.Dark,
        gameDb: {},
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

    @Selector()
    public static getGameDb(state: AppData): GameDatabase {
        return state.gameDb;
    }

    @Selector()
    public static getModListColumns(state: AppData): string[] | undefined {
        return state.modListColumns;
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

    @Action(AppActions.DeleteProfile)
    public deleteProfile(context: AppState.Context, { profile }: AppActions.DeleteProfile): void {
        context.setState(patch({
            profileNames: removeItem(name => name === profile.name)
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

    @Action(AppActions.updateGameDb)
    public updateGameDb(context: AppState.Context, state: AppActions.GameDbAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.updateModListColumns)
    public updateModListColumns(context: AppState.Context, state: AppActions.ModListColumnsAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.ToggleModListColumn)
    public toggleModListColumn(context: AppState.Context, { column }: AppActions.ToggleModListColumn): void {
        const state = _.cloneDeep(context.getState());
        if (!state.modListColumns) {
            state.modListColumns = _.cloneDeep(AppData.DEFAULT_MOD_LIST_COLUMNS);
        }

        const colIndex = state.modListColumns.findIndex(c => c === column);
        if (colIndex === -1) {
            state.modListColumns.push(column);
        } else {
            state.modListColumns.splice(colIndex, 1);
        }

        context.setState(state);
    }

    @Action(AppActions.ResetModListColumns)
    public resetModListColumns(context: AppState.Context, _action: AppActions.ResetModListColumns): void {
        const state = _.cloneDeep(context.getState());

        delete state.modListColumns;

        context.setState(state);
    }
}

export namespace AppState {

    export type Context = StateContext<AppData>;
}
