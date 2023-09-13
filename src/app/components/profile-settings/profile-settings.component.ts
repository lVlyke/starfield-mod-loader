import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { NgForm, NgModel } from "@angular/forms";
import { ComponentState, ComponentStateRef, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { filter, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { AppActions } from "../../state";
import { ObservableUtils } from "../../util/observable-utils";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined } from "../../core/operators";

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
    public profile!: AppProfile;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @DeclareState()
    protected formModel!: AppProfile;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileSettingsComponent>,
        store: Store
    ) {
        super({ cdRef });

        stateRef.get("profile").subscribe(profile => this.formModel = profile);

        this.onFormSubmit$.pipe(
            filter(form => !!form.valid)
        ).subscribe(() => store.dispatch(new AppActions.updateActiveProfile(this.formModel)));
    }

    protected chooseDirectory<K extends keyof AppProfile>(ngModel: NgModel): Observable<any> {
        const formModelName = ngModel.name as K;

        return ObservableUtils.hotResult$(ElectronUtils.chooseDirectory(ngModel.value).pipe(
            filterDefined(),
            tap((directory) => {
                this.formModel = Object.assign(this.formModel, { [formModelName]: directory as AppProfile[K] });
            })
        ));
    }

    protected chooseFile<K extends keyof AppProfile>(ngModel: NgModel): Observable<any> {
        const formModelName = ngModel.name as K;

        return ObservableUtils.hotResult$(ElectronUtils.chooseFilePath(ngModel.value, ["exe", "bat", "cmd", "lnk"]).pipe(
            filterDefined(),
            tap((filePath) => {
                this.formModel = Object.assign(this.formModel, { [formModelName]: filePath as AppProfile[K] });
            })
        ));
    }
}
