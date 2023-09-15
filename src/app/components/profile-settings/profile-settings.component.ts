import * as _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { NgForm, NgModel } from "@angular/forms";
import { ComponentState, ComponentStateRef, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { Observable, combineLatest } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ObservableUtils } from "../../util/observable-utils";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined } from "../../core/operators";
import { ProfileManager } from "src/app/services/profile-manager";

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

    @Input()
    public profile?: AppProfile;

    @Input()
    public createMode = false;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @DeclareState("formModel")
    private _formModel!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileSettingsComponent>,
        store: Store,
        profileManager: ProfileManager
    ) {
        super({ cdRef });

        combineLatest(stateRef.getAll("profile", "createMode")).subscribe(([profile, createMode]) => {
            if (!!profile) {
                this._formModel = _.cloneDeep(profile);
            } else if (!this.formModel && createMode) {
                this._formModel = AppProfile.create("New Profile");
            }
        });

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
