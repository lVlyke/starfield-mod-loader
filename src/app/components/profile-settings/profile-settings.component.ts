import _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from "@angular/core";
import { AbstractControl, NgForm, NgModel, ValidationErrors } from "@angular/forms";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedBehaviorSubject, ManagedSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { combineLatest, EMPTY, forkJoin, Observable, of } from "rxjs";
import { defaultIfEmpty, delay, distinctUntilChanged, filter, finalize, map, mergeMap, startWith, switchMap, take, tap, withLatestFrom } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ElectronUtils } from "../../util/electron-utils";
import { concatJoin, filterDefined, filterFalse, filterTrue, runOnce } from "../../core/operators";
import { ProfileManager } from "../../services/profile-manager";
import { AppState } from "../../state";
import { GameDatabase } from "../../models/game-database";
import { GameId } from "../../models/game-id";
import { DialogManager } from "../../services/dialog-manager";
import { LangUtils } from "../../util/lang-utils";
import { DefaultProfilePathFieldEntry, DefaultProfilePathFieldGroup } from "./profile-standard-path-fields.pipe";
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
    public readonly formModel$ = new ManagedBehaviorSubject<Partial<AppProfile.Form>>(this, {});
    public readonly onFormSubmit$ = new ManagedSubject<AppProfile>(this);
    public readonly onFormStatusChange$ = new ManagedSubject<any>(this);
    public readonly gameDb$: Observable<GameDatabase>;
    public readonly appProfileDescs$: Observable<AppProfile.Description[]>;

    @AsyncState()
    public readonly gameDb!: GameDatabase;

    @AsyncState()
    public readonly appProfileDescs!: AppProfile.Description[];

    @AsyncState()
    public readonly formModel!: Readonly<Partial<AppProfile.Form>>;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @Input("profile")
    public initialProfile!: Partial<AppProfile>;

    @Input()
    public createMode = false;

    @Input()
    public baseProfileMode = false;

    @Input()
    public remedyMode: (keyof AppProfile) | boolean = false;

    protected gameIds: GameId[] = [];
    protected modLinkModeSupported = false;
    protected modLinkModeChildOnlySupported = false;
    protected configLinkModeSupported = false;
    protected manageSavesSupported = false;
    protected profileRootPathValid = false;
    protected manageSteamCompatSymlinksSupported = false;

    private readonly validateProfileName = (control: AbstractControl): ValidationErrors | null => {
        return this.appProfileDescs.some(existingProfile => control.value.toLowerCase() === existingProfile.name.toLowerCase())
            ? { invalidProfileName: true }
            : null;
    };

    private readonly validateProfileRoot = (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value) {
            return of(null);
        }

        return ElectronUtils.invoke("app:checkLinkSupported", {
            targetPath: ".",
            destPaths: [control.value],
            symlink: true,
            symlinkType: "dir"
        }).pipe(map(supported => supported ? null : { invalidProfileRoot: true }));
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

        // Check if app has symlink permissions
        ElectronUtils.invoke("app:checkLinkSupported", {
            targetPath: ".",
            destPaths: ["."],
            symlink: true,
            symlinkType: "file"
        }).pipe(
            filterFalse(),
            switchMap(() => appDialogs.showSymlinkWarningDialog())
        ).subscribe();

        stateRef.get("gameDb").pipe(
            map((gameDb) => (Object.keys(gameDb) as GameId[]).filter(
                gameId => gameId !== "$unknown" && gameId !== "$none"
            ))
        ).subscribe(gameIds => this.gameIds = gameIds);

        stateRef.get("form").pipe(
            filterDefined(),
            distinctUntilChanged()
        ).subscribe((form) => {
            form.controls["name"].addValidators([this.validateProfileName]);
            form.controls["name"].updateValueAndValidity();

            form.controls["rootPathOverride"].addAsyncValidators([this.validateProfileRoot]);
            form.controls["rootPathOverride"].updateValueAndValidity();
        });

        this.formModel$.pipe(
            filter(formModel => !!formModel.name),
            switchMap(formModel => ElectronUtils.invoke("profile:dirLinkSupported", {
                profile: formModel as AppProfile,
                srcDir: "modsPathOverride",
                destDirs: ["gameModDir", "gameRootDir"],
                symlink: false,
                checkBaseProfile: false
            }))
        ).subscribe(linkSupported => this.modLinkModeChildOnlySupported = !!linkSupported);

        this.formModel$.pipe(
            filter(formModel => !!formModel.name),
            switchMap(formModel => ElectronUtils.invoke("profile:dirLinkSupported", {
                profile: formModel as AppProfile,
                srcDir: "modsPathOverride",
                destDirs: ["gameModDir", "gameRootDir"],
                symlink: false,
                checkBaseProfile: true
            }))
        ).subscribe(linkSupported => this.modLinkModeSupported = !!linkSupported);

        this.formModel$.pipe(
            filter(formModel => !!formModel.name),
            switchMap(formModel => ElectronUtils.invoke("profile:dirLinkSupported", {
                profile: formModel as AppProfile,
                srcDir: "configPathOverride",
                destDirs: ["gameConfigFilePath"],
                symlink: true,
                symlinkType: "file",
                checkBaseProfile: true
            }))
        ).subscribe(linkSupported => this.configLinkModeSupported = !!linkSupported);

        combineLatest(stateRef.getAll("formModel", "initialProfile")).pipe(
            filter(([formModel]) => !!formModel.name),
            switchMap(([formModel, initialProfile]) => initialProfile.deployed ? of(!!initialProfile.manageSaveFiles) : ElectronUtils.invoke("profile:dirLinkSupported", {
                profile: formModel as AppProfile,
                srcDir: "savesPathOverride",
                destDirs: ["gameSaveFolderPath"],
                symlink: true,
                symlinkType: "junction",
                checkBaseProfile: false
            }))
        ).subscribe(managedSavesSupported => this.manageSavesSupported = !!managedSavesSupported);

        this.formModel$.pipe(
            switchMap(formModel => formModel.steamGameId ? ElectronUtils.invoke("profile:steamCompatSymlinksSupported", {
                profile: formModel as AppProfile
            }) : of(false))
        ).subscribe(manageSteamCompatSymlinksSupported => this.manageSteamCompatSymlinksSupported = manageSteamCompatSymlinksSupported);

        combineLatest(stateRef.getAll("initialProfile", "createMode")).pipe(
            filter(([, createMode]) => !createMode)
        ).subscribe(([initialProfile]) => this.baseProfileMode = !AppProfile.isFullProfile(initialProfile));

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
            map((profile) => profile.gameId),
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

    protected isFieldGroup(fieldEntry: DefaultProfilePathFieldEntry): fieldEntry is DefaultProfilePathFieldGroup {
        return "groupTitle" in fieldEntry;
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

        let wasDeployed = false;
        return runOnce(this.formModel$.pipe(
            take(1),
            withLatestFrom(this.profileManager.activeProfile$),
            switchMap(([formModel, activeProfile]) => {
                // Undeploy the profile before making any changes
                if (formModel.name === activeProfile?.name && activeProfile?.deployed) {
                    wasDeployed = true;
                    return this.profileManager.updateActiveModDeployment(false).pipe(
                        map(() => formModel)
                    )
                } else {
                    return of(formModel);
                }
            }),
            switchMap((formModel) => this.profileManager.resolveProfileFromForm(formModel as AppProfile.Form, this.baseProfileMode)),
            switchMap((formModel) => this.checkUpdatedProfilePathOverrides(formModel)),
            switchMap((formModel) => (() => {
                // Add/update profile data on submit
                if (this.createMode) {
                    return this.profileManager.addProfile(formModel);
                } else if (!LangUtils.isEqual(this.initialProfile, formModel)) {
                    return this.profileManager.updateActiveProfile(formModel);
                } else {
                    // Skip updates if no changes were made
                    return of(formModel);
                }
            })().pipe(
                switchMap(() => this.checkCreateDefaultConfigFiles(formModel)),
                finalize(() => {
                    if (wasDeployed) {
                        this.profileManager.updateActiveModDeployment(true);
                    }
                    
                    this.onFormSubmit$.next(formModel)
                })
            )
        )));
    }

    private checkCreateDefaultConfigFiles(profile: AppProfile): Observable<AppProfile> {
        const gameDetails = this.gameDb[profile.gameId];
    
        // Check if profile-specific config files need to be created
        if (!this.copyMode && profile.manageConfigFiles && _.size(gameDetails.gameConfigFiles) > 0) {
            // Check if any profile-specific config files exist
            return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                return this.profileManager.readConfigFile(profile, configFile, false);
            })).pipe(
                map(configData => !configData.some(Boolean)),
                filterTrue(),
                switchMap(() => this.appDialogs.showDefault(
                    "No config files exist for this profile. Do you want to create them now?",
                    [DialogManager.YES_ACTION_PRIMARY, DialogManager.NO_ACTION]
                )),
                filterTrue(),
                switchMap(() => {
                    // Write default config files
                    const gameDetails = this.gameDb[profile.gameId];
                    return forkJoin(Object.keys(gameDetails.gameConfigFiles!).map((configFile) => {
                        return this.profileManager.readConfigFile(profile, configFile, true).pipe(
                            mergeMap(fileData => this.profileManager.updateConfigFile(configFile, fileData))
                        );
                    }));
                }),
                map(() => profile),
                defaultIfEmpty(profile)
            );
        } else {
            return of(profile);
        }
    }

    private checkUpdatedProfilePathOverrides(profile: AppProfile): Observable<AppProfile> {
        if (this.createMode) {
            return of(profile);
        }

        const profilePathOverrideKeys = [
            "modsPathOverride",
            "savesPathOverride",
            "configPathOverride",
            "backupsPathOverride",
            "rootPathOverride"
        ] as const;

        // Determine if any profile paths were changed
        const pathDiffs$ = profilePathOverrideKeys
            .filter(pathKey => profile[pathKey] !== this.initialProfile[pathKey])
            .map((pathKey) => concatJoin(
                ElectronUtils.invoke("profile:resolvePath", { profile: this.initialProfile as AppProfile, pathKeys: [pathKey] }),
                ElectronUtils.invoke("profile:resolvePath", { profile, pathKeys: [pathKey] }),
            ).pipe(
                switchMap(([[oldPath], [newPath]]) => {
                    if (oldPath !== newPath) {
                        const missingPath = `<${pathKey}>`;

                        // Ask the user if they want to move old files to new path
                        return this.appDialogs.showProfileMoveFolderDialog(oldPath ?? missingPath, newPath ?? missingPath).pipe(
                            filterDefined(),
                            switchMap(({ overwrite, destructive }) => ElectronUtils.invoke("profile:moveFolder", {
                                pathKey,
                                overwrite,
                                destructive,
                                oldProfile: this.initialProfile as AppProfile,
                                newProfile: profile
                            }))
                        );
                    } else {
                        return EMPTY;
                    }
                })
            ));

        return concatJoin(...pathDiffs$).pipe(
            map(() => profile),
            defaultIfEmpty(profile)
        );
    }
}
