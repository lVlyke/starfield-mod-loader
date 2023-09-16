import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { NgForm, NgModel } from "@angular/forms";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { filter, map, switchMap, take, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ObservableUtils } from "../../util/observable-utils";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined, filterTrue } from "../../core/operators";
import { ProfileManager } from "../../services/profile-manager";
import { AppState } from "../../state";
import { GameDatabase } from "../../models/game-database";

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

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @Input()
    public profile!: AppProfile;

    @Input()
    public createMode = false;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @DeclareState("formModel")
    private _formModel!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileSettingsComponent>,
        profileManager: ProfileManager
    ) {
        super({ cdRef });

        // Clone the input profile so we don't mutate it during editing
        stateRef.get("profile").subscribe((profile) => {
            this._formModel = _.cloneDeep(profile);
        });

        // If `createMode` is set, try to find relevant defaults for the current game title
        stateRef.get("createMode").pipe(
            filterTrue(),
            switchMap(() => stateRef.get("profile")),
            take(1),
            map(profile => this.gameDb[profile.gameId]),
            filterDefined(),
            switchMap(gameDetails => ElectronUtils.invoke("app:findBestProfileDefaults", { gameDetails }))
        ).subscribe((profileDefaults: Partial<AppProfile>) => {
            Object.entries(profileDefaults).forEach(([profileProp, profileDefaultVal]) => {
                if (!_.isNil(profileDefaultVal)) {
                    this._formModel = { ...this._formModel, [profileProp]: profileDefaultVal };
                }
            });
        });

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
            })
        ).subscribe();
    }

    public get formModel(): AppProfile {
        return this._formModel;
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

    protected chooseFile<K extends keyof AppProfile>(ngModel: NgModel): Observable<any> {
        const formModelName = ngModel.name as K;

        return ObservableUtils.hotResult$(ElectronUtils.chooseFilePath(ngModel.value, ["exe", "bat", "cmd", "lnk"]).pipe(
            filterDefined(),
            tap((filePath) => {
                this._formModel = Object.assign(this.formModel, { [formModelName]: filePath as AppProfile[K] });
            })
        ));
    }
}
