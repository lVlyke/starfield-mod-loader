import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, EventEmitter, Output } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { Observable, combineLatest } from "rxjs";
import { tap } from "rxjs/operators";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { AppState } from "../../state";
import { BaseComponent } from "../../core/base-component";
import { GameDetails } from "../../models/game-details";
import { GameDatabase } from "../../models/game-database";
import { GameId } from "../../models/game-id";
import { AppProfile } from "../../models/app-profile";
import { runOnce } from "../../core/operators";
import { ProfileManager } from "../../services/profile-manager";

@Component({
    selector: "app-profile-config-editor",
    templateUrl: "./profile-config-editor.component.html",
    styleUrls: ["./profile-config-editor.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ComponentState.create(AppProfileConfigEditorComponent)],
    standalone: false
})
export class AppProfileConfigEditorComponent extends BaseComponent {

    public readonly gameDb$: Observable<GameDatabase>;

    @Output("configFileUpdate")
    public readonly configFileUpdate$: EventEmitter<Date>;

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @Input()
    public profile!: AppProfile;
    
    @DeclareState()
    protected gameDetails?: GameDetails;

    @DeclareState()
    protected gameConfigFiles?: Record<string, string[]>;

    @DeclareState("lastUpdateDate")
    private _lastUpdateDate = new Date();

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileConfigEditorComponent>,
        store: Store,
        private readonly profileManager: ProfileManager
    ) {
        super({ cdRef });

        this.gameDb$ = store.select(AppState.getGameDb);
        this.configFileUpdate$ = stateRef.emitter("lastUpdateDate");

        combineLatest(stateRef.getAll("profile", "gameDb")).subscribe(([profile, gameDb]) => {
            this.gameDetails = profile ? gameDb[profile.gameId] : gameDb[GameId.UNKNOWN];
            this.gameConfigFiles = this.gameDetails.gameConfigFiles;
        });
    }

    public get lastUpdateDate(): Date {
        return this._lastUpdateDate;
    }

    protected updateConfigFile(fileName: string, data: string): Observable<unknown> {
        return runOnce(this.profileManager.updateConfigFile(fileName, data).pipe(
            tap(() => this.markConfigUpdated())
        ));
    }

    protected reloadConfigFile(fileName: string, control: AbstractControl): Observable<unknown> {
        return runOnce(this.profileManager.readConfigFile(this.profile, fileName, true).pipe(
            tap(fileData => control.setValue(fileData)),
            tap(() => this.markConfigUpdated())
        ));
    }

    protected openConfigFile(fileName: string): Observable<unknown> {
        return this.profileManager.openProfileConfigFile(fileName);
    }

    private markConfigUpdated(date = new Date()): void {
        this._lastUpdateDate = date;
    }
}
