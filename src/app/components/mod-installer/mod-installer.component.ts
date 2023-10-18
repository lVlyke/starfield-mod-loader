import * as _ from "lodash";
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ViewChildren,
    QueryList
} from "@angular/core";
import { NgForm, NgModel } from "@angular/forms";
import { MatStepper } from "@angular/material/stepper";
import { Select } from "@ngxs/store";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { EMPTY, Observable, forkJoin, from, of } from "rxjs";
import { concatMap, delay, distinctUntilChanged, finalize, map, mergeMap, switchMap, tap, toArray } from "rxjs/operators";
import { AppModInstaller } from "./mod-installer.types";
import { BaseComponent } from "../../core/base-component";
import { filterDefined, filterTrue } from "../../core/operators";
import { ModImportRequest } from "../../models/mod-import-status";
import { ModInstaller } from "../../models/mod-installer";
import { AppProfile } from "../../models/app-profile";
import { DialogManager } from "../../services/dialog-manager";
import { AppState } from "../../state";
import { ProfileManager } from "../../services/profile-manager";
import { ObservableUtils } from "../../util/observable-utils";

@Component({
    selector: "app-mod-installer",
    templateUrl: "./mod-installer.component.html",
    styleUrls: ["./mod-installer.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModInstallerComponent)
    ],
    host: {
        "[attr.compact-view]": "compactView"
    }
})
export class AppModInstallerComponent extends BaseComponent {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);

    @Select(AppState.getActiveProfile)
    public readonly activeProfile$!: Observable<AppProfile>;

    @Output("importRequestChange")
    public readonly importRequestChange$ = new EventEmitter<ModImportRequest>();

    @Input()
    public importRequest!: ModImportRequest;

    @Input()
    public compactView: boolean = false;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @ViewChild("installStepper")
    public readonly installStepper!: MatStepper;

    @ViewChildren("pluginGroupModel", { read: NgModel })
    public readonly pluginGroupNgModels!: QueryList<NgModel>;

    @AsyncState()
    public readonly activeProfile!: AppProfile;

    protected readonly PluginGroupType = ModInstaller.PluginGroup.Type;
    protected readonly PluginType = ModInstaller.PluginType.Name;

    @DeclareState("installSteps")
    protected _installSteps: AppModInstaller.InstallStep[] = [];
    
    protected previewPlugin: AppModInstaller.Plugin | undefined;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppModInstallerComponent>,
        dialogManager: DialogManager,
        private readonly profileManager: ProfileManager
    ) {
        super({ cdRef });

        // Check if this mod has all required dependencies
        stateRef.get("importRequest").pipe(
            filterDefined(),
            switchMap(importRequest => this.resolveCompositeDependencies(importRequest.installer!.config.moduleDependencies).pipe(
                switchMap(result => result ? EMPTY : of(importRequest))
            )),
            switchMap((importRequest) => {
                const ignoreAction = { label: "Ignore" };

                console.info("FOMOD installer dependency check failed: ", importRequest.installer!.config.moduleDependencies);

                // TODO - Show missing deps
                return dialogManager.createDefault(
                    "Mod is missing required dependencies.",
                    [ignoreAction, DialogManager.CANCEL_ACTION_PRIMARY],
                    { hasBackdrop: true}
                ).pipe(
                    tap((selectedAction) => {
                        if (selectedAction === DialogManager.CANCEL_ACTION_PRIMARY) {
                            importRequest.importStatus = "CANCELED";
                            this.onFormSubmit$.next(this.form);
                        }
                    })
                );
            })
        ).subscribe();

         // Determine the default name for the mod
         stateRef.get("importRequest").pipe(
            filterDefined(),
            distinctUntilChanged()
         ).subscribe((importRequest) => {
            let bestModName = importRequest.installer!.info?.name ?? importRequest.installer!.config.moduleName._ ?? importRequest.modName;
            if (importRequest.installer!.info?.version) {
                bestModName += ` - ${importRequest.installer!.info.version}`;
            }
            importRequest.modName = bestModName;
        });

        // Create the list of install steps
        stateRef.get("importRequest").pipe(
            distinctUntilChanged(),
            switchMap(importRequest => this.createInstallSteps(importRequest.installer!, false))
        ).subscribe(installSteps => this._installSteps = installSteps);

        // Trigger initial model updates on form load
        stateRef.get("pluginGroupNgModels").pipe(
            filterDefined(),
            delay(0),
            switchMap(() => this.updateFiles())
        ).subscribe();
    }

    public get installSteps(): AppModInstaller.InstallStep[] {
        return this._installSteps;
    }

    protected updateFiles(): Observable<unknown> {
        this.importRequest.modFilePathMapFilter = {};

        this.updatePluginGroupFiles();
        return ObservableUtils.hotResult$(this.updateConditionalFiles().pipe(
            finalize(() => {
                this.updateRequiredFiles();

                console.log(this.importRequest.modFilePathMapFilter, this.calculateInstallerFlags());
                this.importRequestChange$.emit(this.importRequest);
            })
        ));
    }

    private updatePluginGroupFiles(): void {
        this.pluginGroupNgModels.forEach((ngModel) => {
            const plugins: AppModInstaller.Plugin[] = Array.isArray(ngModel.value) ? ngModel.value : [ngModel.value];

            // Add all active plugin files & flags in this group
            plugins.forEach((plugin) => {
                if (!!plugin.pluginInfo.files?.[0]) {
                    this.updateFilePathMap(plugin.pluginInfo.files[0]);
                }
            });
        });
    }

    private calculateInstallerFlags(): AppModInstaller.Flags {
        const installerFlags: AppModInstaller.Flags = {};

        this.pluginGroupNgModels.forEach((ngModel) => {
            const plugins: AppModInstaller.Plugin[] = Array.isArray(ngModel.value) ? ngModel.value : [ngModel.value];

            plugins.forEach((plugin) => {
                if (!!plugin.pluginInfo.conditionFlags?.[0]?.flag) {
                    plugin.pluginInfo.conditionFlags[0].flag.forEach(flag => installerFlags[flag.name[0]] = flag._ ?? true);
                }
            });
        });

        return installerFlags;
    }

    private updateRequiredFiles(): void {
        this.importRequest.installer!.config.requiredInstallFiles.forEach((files) => {
            this.updateFilePathMap(files);
        });
    }

    private updateConditionalFiles(): Observable<unknown> {
        const patterns = this.importRequest.installer!.config.conditionalFileInstalls?.patterns?.[0]?.pattern ?? [];

        if (patterns.length === 0) {
            return EMPTY;
        }

        return from(patterns).pipe(
            concatMap(({ dependencies, files }) => this.resolveCompositeDependencies(dependencies).pipe(
                filterTrue(),
                tap(() => this.updateFilePathMap(files[0]))
            )),
            toArray()
        );
    }

    private updateFilePathMap(files: ModInstaller.FileList | ModInstaller.FileSystemItem[]): void {
        const filePathMap = this.importRequest.modFilePathMapFilter!;
        const fileEntries = Array.isArray(files) ? files : [
            files.file ?? [],
            files.folder ?? []
        ].flat();

        fileEntries.forEach((fileEntry) => {
            // TODO - Support `alwaysInstall`, `installIfUsable`, `priority`

            const srcPath = fileEntry.source[0];
            const destPath = fileEntry.destination?.[0] ?? srcPath;
            filePathMap[srcPath] = destPath;
        });
    }

    protected resolveCompositeDependencies(dependencies: ModInstaller.CompositeDependency[]): Observable<boolean> {
        const installerFlags = this.calculateInstallerFlags();

        return from(dependencies).pipe(
            mergeMap(({
                operator,
                fileDependency,
                flagDependency,
                dependencies,
                gameDependency,
                fommDependency
            }) => {
                const depOperator = operator?.[0] ?? ModInstaller.CompositeDependency.Operator.And;
                const conditions: Observable<boolean>[] = [];
    
                if (fileDependency && fileDependency.length > 0) {
                    conditions.push(...fileDependency.map(fileDependency => this.resolveFileDependency(fileDependency)));
                }
    
                if (dependencies && dependencies.length > 0) {
                    conditions.push(this.resolveCompositeDependencies(dependencies));
                }
    
                if (flagDependency && flagDependency.length > 0) {
                    conditions.push(...flagDependency.map((flagDependency) => {
                        return of(installerFlags[flagDependency.flag[0]] === (flagDependency.value[0] ?? true));
                    }));
                }
    
                if (gameDependency && gameDependency.length > 0) {
                    // TODO - Check `gameDependency`
                    console.warn("WARNING - Ignoring unsupported FOMOD gameDependency check: ", gameDependency);
                }
    
                if (fommDependency && fommDependency.length > 0) {
                    // TODO - Check `fommDependency`
                    console.warn("WARNING - Ignoring unsupported FOMOD fommDependency check: ", fommDependency);
                }

                return forkJoin(conditions).pipe(
                    map(conditions => depOperator === ModInstaller.CompositeDependency.Operator.And
                        ? conditions.every(Boolean)
                        : conditions.some(Boolean)
                    )
                );
            }),
            toArray(),
            map(results => results.every(Boolean))
        );
    }

    private resolveFileDependency(file: ModInstaller.FileDependency | string): Observable<boolean> {
        const filePathMap = this.importRequest.modFilePathMapFilter!;
        const fileState = typeof file === "string"
            ? ModInstaller.DependencyState.Active
            : (file.state?.[0] ?? ModInstaller.DependencyState.Active);
        const rawFilePath = typeof file === "string"
            ? file
            : file.file[0];
        const localFile = filePathMap[rawFilePath];
        
        if (localFile) {
            return of(fileState === ModInstaller.DependencyState.Active);
        }

        const profileMods = this.activeProfile.mods;
        const filePath = rawFilePath.replace(/[\\/]/g, "");
        const manualFiles = this.activeProfile.manualMods;
        const manualMatch = manualFiles?.find((manualFile) => {
            return manualFile.replace(/[\\/]/g, "").toLowerCase() === filePath.toLowerCase();
        });

        if (manualMatch) {
            return of(fileState === ModInstaller.DependencyState.Active);
        }

        return from(profileMods.entries()).pipe(
            mergeMap(([modName, modEntry]) => this.profileManager.readModFilePaths(modName, true).pipe(
                map(modFilePaths => modFilePaths.some((modFilePath) => {
                    if (filePath.toLowerCase() === modFilePath.toLowerCase()) {
                        switch (fileState) {
                            case ModInstaller.DependencyState.Inactive:
                                return !modEntry.enabled;
                            case ModInstaller.DependencyState.Active:
                                return modEntry.enabled;
                        }
                    }

                    return false;
                }))
            )),
            toArray(),
            map(results => results.filter(Boolean)),
            map(matches => matches.length > 0 || fileState === ModInstaller.DependencyState.Missing)
        );
    }

    private createInstallSteps(installer: ModInstaller, filterVisible: boolean): Observable<AppModInstaller.InstallStep[]> {
        console.log(installer);

        const installSteps = installer.config.installSteps;

        if (!installSteps) {
            return of([]);
        }

        return from(installSteps.installStep).pipe(
            concatMap(installStep => this.resolveCompositeDependencies(
                filterVisible && installStep.visible ? installStep.visible : []
            ).pipe(
                switchMap(visible => visible ? of({
                    stepInfo: installStep,
                    name: installStep.name[0],
                    pluginGroups: this.createPluginGroups(installStep)
                }) : EMPTY)
            )),
            toArray(),
            map((processedInstallSteps) => {
                const order = installSteps.order?.[0] ?? ModInstaller.Order.Ascending;
                processedInstallSteps = this.orderedSort(processedInstallSteps, order);
        
                return processedInstallSteps;
            })
        );
    }

    private createPluginGroups(installStep: ModInstaller.InstallStep): AppModInstaller.PluginGroup[] {
        const pluginGroups = installStep.optionalFileGroups[0];
        let processedPluginGroups = pluginGroups.group.map((pluginGroup) => ({
            pluginGroupInfo: pluginGroup,
            name: pluginGroup.name[0],
            type: pluginGroup.type[0],
            plugins: this.createPlugins(pluginGroup)
        }));

        const order = pluginGroups.order?.[0] ?? ModInstaller.Order.Ascending;
        processedPluginGroups = this.orderedSort(processedPluginGroups, order);

        return processedPluginGroups;
    }

    private createPlugins(pluginGroup: ModInstaller.PluginGroup): AppModInstaller.Plugin[] {
        const plugins = pluginGroup.plugins[0];
        let processedPlugins = plugins.plugin.map((plugin) => ({
            pluginGroup,
            pluginInfo: plugin,
            name: plugin.name[0],
            type: plugin.typeDescriptor[0].type[0].name[0],
            flags: this.createPluginFlags(plugin),
            description: plugin.description?.[0],
            image: plugin.image?.[0]
        }));

        const order = plugins.order?.[0] ?? ModInstaller.Order.Ascending;
        processedPlugins = this.orderedSort(processedPlugins, order);

        return processedPlugins;
    }

    private createPluginFlags(plugin: ModInstaller.Plugin): AppModInstaller.Flag[] {
        return plugin.conditionFlags?.[0].flag.map((flag) => ({
            name: flag.name[0],
            value: flag._
        })) ?? [];
    }

    private orderedSort<T extends { name: string }>(
        namedItems: T[],
        order?: ModInstaller.Order
    ): T[] {
        order ??= ModInstaller.Order.Ascending;
        if (order === ModInstaller.Order.Ascending) {
            namedItems = _.orderBy(namedItems, "name", "asc");
        } else if (order === ModInstaller.Order.Descending) {
            namedItems = _.orderBy(namedItems, "name", "desc");
        }

        return namedItems;
    }
}
