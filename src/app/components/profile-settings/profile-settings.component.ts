import _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { AbstractControl, NgForm, NgModel, ValidationErrors } from "@angular/forms";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedBehaviorSubject, ManagedSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { combineLatest, EMPTY, forkJoin, Observable, of } from "rxjs";
import { delay, distinctUntilChanged, filter, finalize, map, mergeMap, startWith, switchMap, take, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined, filterTrue, runOnce } from "../../core/operators";
import { ProfileManager } from "../../services/profile-manager";
import { AppState } from "../../state";
import { GameDatabase } from "../../models/game-database";
import { GameId } from "../../models/game-id";
import { DialogManager } from "../../services/dialog-manager";
import { LangUtils } from "../../util/lang-utils";
import { AppDialogs } from "../../services/app-dialogs";

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

    public readonly GameId = GameId;
    public readonly formModel$ = new ManagedBehaviorSubject<Partial<AppProfile>>(this, {});
    public readonly onFormSubmit$ = new ManagedSubject<AppProfile>(this);
    public readonly onFormStatusChange$ = new ManagedSubject<any>(this);
    public readonly gameDb$: Observable<GameDatabase>;
    public readonly appProfileDescs$: Observable<AppProfile.Description[]>;

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @AsyncState()
    public readonly appProfileDescs!: AppProfile.Description[];

    @AsyncState()
    public readonly formModel!: Readonly<Partial<AppProfile>>;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @Input("profile")
    public initialProfile!: Partial<AppProfile>;

    @Input()
    public createMode = false;

    @Input()
    public remedyMode: (keyof AppProfile) | boolean = false;

    protected gameIds: GameId[] = [];
    protected linkModeSupported = false;

    private readonly validateProfileName = (control: AbstractControl): ValidationErrors | null => {
        return this.appProfileDescs.some(existingProfile => control.value.toLowerCase() === existingProfile.name.toLowerCase())
            ? { invalidProfileName: true }
            : null;
    };

    @DeclareState("defaultPaths")
    private _defaultPaths?: AppProfile.DefaultablePaths;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileSettingsComponent>,
        store: Store,
        private readonly appDialogs: AppDialogs,
        protected readonly profileManager: ProfileManager
    ) {
        super({ cdRef });

        this.gameDb$ = store.select(AppState.getGameDb);
        this.appProfileDescs$ = store.select(AppState.getProfileDescriptions);

        stateRef.get("gameDb").pipe(
            map((gameDb) => (Object.keys(gameDb) as GameId[]).filter(
                gameId => gameId !== "$unknown" && gameId !== "$none"
            ))
        ).subscribe(gameIds => this.gameIds = gameIds);

        stateRef.get("form").pipe(
            filterDefined(),
            distinctUntilChanged()
        ).subscribe(({ form }) => {
            form.controls["name"].addValidators([this.validateProfileName]);
            form.controls["name"].updateValueAndValidity();
        });

        this.formModel$.pipe(
            switchMap(formModel => ElectronUtils.invoke("profile:linkModeSupported", { profile: formModel as AppProfile }))
        ).subscribe(linkModeSupported => this.linkModeSupported = linkModeSupported);

        stateRef.get("form").pipe(
            filterDefined(),
            switchMap(form => form.statusChanges!.pipe(
                startWith(form.status)
            ))
        ).subscribe(this.onFormStatusChange$);

        stateRef.get("form").pipe(
            filterDefined(),
            switchMap(form => form.valueChanges!.pipe(
                map(() => form.control.getRawValue()),
                startWith(form.control.getRawValue())
            )),
            map(formValue => Object.assign({}, this.initialProfile, formValue)),
            distinctUntilChanged((x, y) => LangUtils.isEqual(x, y))
        ).subscribe(formModel => this.formModel$.next(formModel));

        // Get the default profile paths for the current game
        this.formModel$.pipe(
            map((profile: Partial<AppProfile>) => profile.gameId),
            filter((gameId): gameId is GameId => !!gameId),
            distinctUntilChanged(),
            switchMap(gameId => ElectronUtils.invoke("app:findBestProfileDefaults", { gameId }))
        ).subscribe(profileDefaults => this._defaultPaths = profileDefaults);

        // Attempt to apply default profile path values for any empty and clean path controls
        combineLatest([
            stateRef.get("defaultPaths"),
            this.formModel$
        ]).pipe(
            distinctUntilChanged((x, y) => LangUtils.isEqual(x, y)),
            map(([defaultPaths]) => Object.keys(defaultPaths ?? {}) as Array<keyof AppProfile.DefaultablePaths>),
            delay(0)
        ).subscribe((defaultPathIds) => defaultPathIds.forEach((pathId) => {
            const control = this.form.controls[pathId];
            const suggestedValue = this.defaultPaths![pathId];
            const initialValue = this.initialProfile[pathId];
            if (control && control.untouched && !control.dirty && (this.createMode ? !initialValue : !control.value)) {
                if (!!suggestedValue) {
                    control.setValue(suggestedValue);
                } else {
                    control.reset();
                }
            }
        }));
    }

    public get defaultPaths(): AppProfile.DefaultablePaths | undefined {
        return this._defaultPaths;
    }

    public get copyMode(): boolean {
        return this.createMode && !!this.initialProfile;
    }

    protected chooseDirectory<K extends keyof AppProfile>(ngModel: NgModel): Observable<any> {
        return runOnce(ElectronUtils.chooseDirectory(ngModel.value || undefined).pipe(
            filterDefined(),
            tap((directory) => ngModel.control.setValue(directory as AppProfile[K]))
        ));
    }

    protected chooseFile<K extends keyof AppProfile>(
        ngModel: NgModel,
        fileTypes: string[]
    ): Observable<any> {
        return runOnce(ElectronUtils.chooseFilePath(ngModel.value || undefined, fileTypes).pipe(
            filterDefined(),
            tap((filePath) => ngModel.control.setValue(filePath as AppProfile[K]))
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

    protected submitForm(form: NgForm): Observable<unknown> {
        if (!form.valid) {
            return EMPTY;
        }

        return runOnce(this.formModel$.pipe(
            take(1),
            map((formModel): AppProfile => formModel as AppProfile),
            switchMap((formModel) => (() => {
                // Add/update profile data on submit
                if (this.createMode) {
                    this.profileManager.saveProfile(formModel);
                    return this.profileManager.addProfile(formModel);
                } else if (!LangUtils.isEqual(this.initialProfile, formModel)) {
                    return this.profileManager.updateActiveProfile(formModel);
                } else {
                    // Skip updates if no changes were made
                    return of(formModel);
                }
            })().pipe(
                finalize(() => this.onFormSubmit$.next(formModel)),
                switchMap(() => {
                    const gameDetails = this.gameDb[formModel.gameId];
    
                    // Check if profile-specific config files need to be created
                    if (!this.copyMode && formModel.manageConfigFiles && _.size(gameDetails.gameConfigFiles) > 0) {
                        // Check if any profile-specific config files exist
                        return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                            return this.profileManager.readConfigFile(formModel, configFile, false);
                        })).pipe(map(configData => !configData.some(Boolean)));
                    } else {
                        return of(false);
                    }
                }),
                filterTrue(),
                switchMap(() => this.appDialogs.showDefault(
                    "No config files exist for this profile. Do you want to create them now?",
                    [DialogManager.YES_ACTION_PRIMARY, DialogManager.NO_ACTION]
                )),
                filterTrue(),
                switchMap(() => {
                    // Write default config files
                    const gameDetails = this.gameDb[formModel.gameId];
                    return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                        return this.profileManager.readConfigFile(formModel, configFile, true).pipe(
                            mergeMap(fileData => this.profileManager.updateConfigFile(configFile, fileData))
                        );
                    }));
                })
            ))
        ));
    }
}
