import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { NgForm, NgModel } from "@angular/forms";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { combineLatest, forkJoin, Observable, of } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ObservableUtils } from "../../util/observable-utils";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined, filterTrue } from "../../core/operators";
import { ProfileManager } from "../../services/profile-manager";
import { AppState } from "../../state";
import { GameDatabase } from "../../models/game-database";
import { GameId } from "../../models/game-id";
import { DialogManager } from "../../services/dialog-manager";
import { LangUtils } from "../../util/lang-utils";
import { DefaultProfilePaths } from "./profile-standard-path-fields.pipe";

@Component({
    selector: "app-profile-settings",
    templateUrl: "./profile-settings.component.html",
    styleUrls: ["./profile-settings.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileSettingsComponent),
    ]
})
export class AppProfileSettingsComponent extends BaseComponent {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);

    @Select(AppState.getGameDb)
    public readonly gameDb$!: Observable<GameDatabase>;

    @Select(AppState.isPluginsEnabled)
    public readonly isPluginsEnabled$!: Observable<boolean>;

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @AsyncState()
    public readonly isPluginsEnabled!: boolean;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @Input()
    public profile!: AppProfile;

    @Input()
    public createMode = false;

    @Input()
    public remedyMode: (keyof AppProfile) | boolean = false;

    protected gameIds: GameId[] = [];

    @DeclareState("formModel")
    private _formModel!: AppProfile;

    @DeclareState("defaultPaths")
    private _defaultPaths?: DefaultProfilePaths;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileSettingsComponent>,
        dialogManager: DialogManager,
        protected readonly profileManager: ProfileManager
    ) {
        super({ cdRef });

        this.gameDb$.pipe(
            this.managedSource()
        ).subscribe(gameDb => this.gameIds = Object.keys(gameDb) as GameId[]);

        // Clone the input profile so we don't mutate it during editing
        stateRef.get("profile").subscribe((profile) => {
            this._formModel = _.cloneDeep(profile);
        });

        // Get the default profile paths for the current game
        stateRef.get("form").pipe(
            filterDefined(),
            switchMap(form => form.valueChanges!),
            map((profile: Partial<AppProfile>) => profile.gameId),
            filter((gameId): gameId is string => !!gameId),
            distinctUntilChanged(),
            switchMap(gameId => ElectronUtils.invoke<DefaultProfilePaths>("app:findBestProfileDefaults", { gameId }))
        ).subscribe(profileDefaults => this._defaultPaths = profileDefaults);

        // Attempt to apply default profile path values for any empty and clean path controls
        stateRef.get("form").pipe(
            filterDefined(),
            switchMap(form => combineLatest([
                stateRef.get("defaultPaths"),
                form.valueChanges!
            ])),
            distinctUntilChanged((x, y) => LangUtils.isEqual(x, y)),
            map(([defaultPaths]) => Object.keys(defaultPaths ?? {}) as Array<keyof DefaultProfilePaths>)
        ).subscribe((defaultPathIds) => defaultPathIds.forEach((pathId) => {
            const control = this.form.controls[pathId];
            const defaultValue = this.defaultPaths![pathId];
            if (control && control.untouched && !control.dirty && (this.createMode || !control.value)) {
                if (!!defaultValue) {
                    control.setValue(defaultValue);
                } else {
                    control.reset();
                }
            }
        }));

        // Update/create the profile on form submit
        this.onFormSubmit$.pipe(
            filter(form => !!form.valid),
            switchMap(() => {
                if (this.createMode) {
                    profileManager.saveProfile(this.formModel);
                    return profileManager.addProfile(this.formModel);
                } else {
                    return profileManager.updateActiveProfile(this.formModel);
                }
            }),
            switchMap(() => {
                const gameDetails = this.gameDb[this.formModel.gameId];

                // Check if profile-specific config files need to be created
                if (this.formModel.manageConfigFiles && _.size(gameDetails.gameConfigFiles) > 0) {
                    // Check if any profile-specific config files exist
                    return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                        return profileManager.readConfigFile(configFile);
                    })).pipe(map(configData => !configData.some(Boolean)));
                } else {
                    return of(false);
                }
            }),
            filterTrue(),
            switchMap(() => dialogManager.createDefault(
                "No config files exist for this profile. Do you want to create them now?",
                [DialogManager.YES_ACTION_PRIMARY, DialogManager.NO_ACTION], {
                    hasBackdrop: true
                }
            )),
            filter(result => result === DialogManager.YES_ACTION_PRIMARY),
            switchMap(() => {
                // Write default config files
                const gameDetails = this.gameDb[this.formModel.gameId];
                return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                    return profileManager.readConfigFile(configFile, true).pipe(
                        switchMap(fileData => profileManager.updateConfigFile(configFile, fileData))
                    );
                }));
            })
        ).subscribe();
    }

    public get formModel(): AppProfile {
        return this._formModel;
    }

    public get defaultPaths(): DefaultProfilePaths | undefined {
        return this._defaultPaths;
    }

    protected chooseDirectory<K extends keyof AppProfile>(ngModel: NgModel): Observable<any> {
        const formModelName = ngModel.name as K;

        return ObservableUtils.hotResult$(ElectronUtils.chooseDirectory(ngModel.value).pipe(
            filterDefined(),
            tap((directory) => {
                this._formModel = Object.assign(this.formModel, { [formModelName]: directory as AppProfile[K] });
            })
        ));
    }

    protected chooseFile<K extends keyof AppProfile>(
        ngModel: NgModel,
        fileTypes: string[]
    ): Observable<any> {
        const formModelName = ngModel.name as K;

        return ObservableUtils.hotResult$(ElectronUtils.chooseFilePath(ngModel.value, fileTypes).pipe(
            filterDefined(),
            tap((filePath) => {
                this._formModel = Object.assign(this.formModel, { [formModelName]: filePath as AppProfile[K] });
            })
        ));
    }

    protected choosePath<K extends keyof AppProfile>(
        ngModel: NgModel,
        fileTypes?: string[]
    ): Observable<any> {
        if (!!fileTypes) {
            return this.chooseFile<K>(ngModel, fileTypes);
        } else {
            return this.chooseDirectory<K>(ngModel);
        }
    }
}
