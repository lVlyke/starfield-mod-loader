import _ from "lodash";
import { AppData } from "../models/app-data";
import { Injectable } from "@angular/core";
import { State, Selector, Action, StateContext } from "@ngxs/store";
import { append, patch, removeItem } from "@ngxs/store/operators";
import { AppActions } from "./app.actions";
import { AppProfile } from "../models/app-profile";
import { ActiveProfileState } from "./active-profile/active-profile.state";
import { AppTheme } from "../models/app-theme";
import { GameDatabase } from "../models/game-database";
import { GameDetails } from "../models/game-details";

@State<AppData>({
    name: "app",
    defaults: {
        profiles: [],
        theme: AppTheme.Dark,
        gameDb: {} as GameDatabase,
        pluginsEnabled: true,
        normalizePathCasing: false,
        verifyProfileOnStart: true
    },
    children: [ActiveProfileState] // TODO - NGXS child states are deprecated
})
@Injectable()
export class AppState {

    @Selector()
    public static get(state: AppData): AppData {
        return state;
    }

    @Selector()
    public static getProfileDescriptions(state: AppData): AppProfile.Description[] {
        return state.profiles;
    }
    
    @Selector()
    public static getActiveProfile(state: AppData): AppProfile | undefined {
        return state.activeProfile;
    }

    @Selector()
    public static getActiveGameDetails(state: AppData): GameDetails | undefined {
        if (!state.gameDb || !state.activeProfile) {
            return undefined;
        }

        return state.gameDb[state.activeProfile.gameId];
    }

    @Selector()
    public static getTheme(state: AppData): AppTheme {
        return state.theme;
    }

    @Selector()
    public static isPluginsEnabled(state: AppData): boolean {
        return state.pluginsEnabled;
    }

    @Selector()
    public static isDeployInProgress(state: AppData): boolean {
        return !!state.deployInProgress;
    }

    @Selector()
    public static isLogPanelEnabled(state: AppData): boolean {
        return !!state.logPanelEnabled;
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

    @Action(AppActions.UpdateSettingsFromUserCfg)
    public updateSettingsFromUserCfg(context: AppState.Context, { settings }: AppActions.UpdateSettingsFromUserCfg): void {
        const state = _.cloneDeep(context.getState());

        if (settings.modListColumns !== undefined) {
            state.modListColumns = settings.modListColumns;
        }

        if (settings.pluginsEnabled !== undefined) {
            state.pluginsEnabled = settings.pluginsEnabled;
        }

        if (settings.normalizePathCasing !== undefined) {
            state.normalizePathCasing = settings.normalizePathCasing;
        }

        if (settings.verifyProfileOnStart !== undefined) {
            state.verifyProfileOnStart = settings.verifyProfileOnStart
        }

        if (settings.steamCompatDataRoot !== undefined) {
            state.steamCompatDataRoot = settings.steamCompatDataRoot;
        }

        if (settings.logPanelEnabled !== undefined) {
            state.logPanelEnabled = settings.logPanelEnabled;
        }

        context.setState(state);
    }

    @Action(AppActions.SetProfiles)
    public setProfiles(context: AppState.Context, { profiles }: AppActions.SetProfiles): void {
        context.setState(patch({
            profiles
        }));
    }

    @Action(AppActions.AddProfile)
    public addProfile(context: AppState.Context, { profile }: AppActions.AddProfile): void {
        context.setState(patch({
            profiles: append([profile])
        }));
    }

    @Action(AppActions.DeleteProfile)
    public deleteProfile(context: AppState.Context, { profile }: AppActions.DeleteProfile): void {
        context.setState(patch({
            profiles: removeItem(curProfile => curProfile.name === profile.name && curProfile.gameId === profile.gameId)
        }));
    }

    @Action(AppActions.updateActiveProfile)
    public updateActiveProfile(context: AppState.Context, state: AppActions.ActiveProfileAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.setDeployInProgress)
    public setDeployInProgress(context: AppState.Context, state: AppActions.DeployInProgressAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.setPluginsEnabled)
    public setPluginsEnabled(context: AppState.Context, state: AppActions.PluginsEnabledAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.setNormalizePathCasing)
    public setNormalizePathCasing(context: AppState.Context, state: AppActions.NormalizePathCasingAction): void {
        context.patchState(_.cloneDeep(state));
    }

    @Action(AppActions.setVerifyProfileOnStart)
    public setVerifyProfileOnStart(context: AppState.Context, state: AppActions.VerifyProfileOnStartAction): void {
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

    @Action(AppActions.ToggleLogPanel)
    public toggleLogPanel(context: AppState.Context, { enabled }: AppActions.ToggleLogPanel): void {
        const state = _.cloneDeep(context.getState());

        state.logPanelEnabled = enabled !== undefined ? enabled : !state.logPanelEnabled;

        context.setState(state);
    }
}

export namespace AppState {

    export type Context = StateContext<AppData>;
}
