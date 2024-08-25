import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, NgForm, ValidationErrors } from "@angular/forms";
import { AsyncState, ComponentState, ComponentStateRef, DeclareState, ManagedBehaviorSubject, ManagedSubject } from "@lithiumjs/angular";
import { Store } from "@ngxs/store";
import { FlatTreeControl } from "@angular/cdk/tree";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { BehaviorSubject, EMPTY, Observable, combineLatest } from "rxjs";
import { filter, map, switchMap, take, tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { filterDefined } from "../../core/operators";
import { ModImportRequest } from "../../models/mod-import-status";
import { AppProfile } from "../../models/app-profile";
import { AppState } from "../../state";
import { DialogManager } from "../../services/dialog-manager";
import { GameDetails } from "../../models/game-details";
import { DialogAction } from "../../services/dialog-manager.types";
import { AppStateBehaviorManager } from "../../services/app-state-behavior-manager";

interface FileTreeNode {
    terminal: boolean;
    fullPath: string;
    pathPart: string;
    level: number;
    parent?: FileTreeNode;
    children?: FileTreeNode[];
    enabled$: BehaviorSubject<boolean>;
}

type FileTreeNodeRecord = Record<string, FileTreeNode>;

@Component({
    selector: "app-mod-import-options",
    templateUrl: "./mod-import-options.component.html",
    styleUrls: ["./mod-import-options.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModImportOptionsComponent),
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: AppModImportOptionsComponent
        }
    ]
})
export class AppModImportOptionsComponent extends BaseComponent implements ControlValueAccessor {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);
    public readonly activeProfile$: Observable<AppProfile | undefined>;
    public readonly gameDetails$: Observable<GameDetails | undefined>;
    public readonly isPluginsEnabled$: Observable<boolean>;

    @Output("importRequestChange")
    public readonly importRequestChange$ = new EventEmitter<ModImportRequest>();

    @AsyncState()
    public readonly activeProfile?: AppProfile;

    @AsyncState()
    public readonly gameDetails?: GameDetails;

    @AsyncState()
    public readonly isPluginsEnabled!: boolean;

    @Input()
    public importRequest!: ModImportRequest;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    private readonly _fileNodeTransformer = (inputData: FileTreeNode, level: number): FileTreeNode => {
        return Object.assign(inputData, { level });
    };

    private _validateFilesEnabled = (_control: AbstractControl): ValidationErrors | null => {
        return this.importRequest.modFilePaths.some(({ enabled }) => enabled)
            ? null
            : { noFiles: true };
    };

    protected readonly nodeIsDir = (_level: number, node: FileTreeNode) => !node.terminal;

    protected readonly treeControl = new FlatTreeControl<FileTreeNode>(
        node => node.level,
        node => !node.terminal
    );

    protected readonly treeFlattener = new MatTreeFlattener(
        this._fileNodeTransformer,
        node => node.level,
        node => !node.terminal,
        node => node.children,
    );

    protected readonly filesDataSource = new MatTreeFlatDataSource(
        this.treeControl, this.treeFlattener
    );

    @DeclareState("fileDataInput")
    private _fileDataInput!: FileTreeNode[];

    @DeclareState("detectedScriptExtender")
    private _detectedScriptExtender?: GameDetails.ScriptExtender;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppModImportOptionsComponent>,
        store: Store,
        dialogManager: DialogManager,
        appStateMgmt: AppStateBehaviorManager
    ) {
        super({ cdRef });

        this.activeProfile$ = store.select(AppState.getActiveProfile);
        this.gameDetails$ = store.select(AppState.getActiveGameDetails);
        this.isPluginsEnabled$ = store.select(AppState.isPluginsEnabled);

        // Create a nested array of `FileTreeNode` objects based on `importRequest.modFilePaths`
        stateRef.get("importRequest").pipe(
            map((importRequest) => importRequest.modFilePaths.reduce((inputData, { filePath, enabled }) => {
                const pathParts = filePath.split(importRequest.filePathSeparator);
                let curPath = "";
                let parentInputData: FileTreeNode | undefined = undefined;
                pathParts.forEach((pathPart, index) => {
                    if (index > 0) {
                        curPath += importRequest.filePathSeparator;
                    }

                    curPath += pathPart;

                    const pathPartInputData = inputData[curPath] ?? {
                        pathPart,
                        fullPath: curPath,
                        parent: parentInputData,
                        enabled$: new ManagedBehaviorSubject<boolean>(this, enabled),
                        terminal: true
                    };

                    if (index < pathParts.length - 1) {
                        pathPartInputData.children ??= [];
                        pathPartInputData.terminal = false;
                    }

                    if (parentInputData && !parentInputData.children!.includes(pathPartInputData)) {
                        parentInputData.children!.push(pathPartInputData);
                    }

                    inputData[curPath] = pathPartInputData;
                    parentInputData = pathPartInputData;
                });

                return inputData;
            }, {} as FileTreeNodeRecord)),
            map(inputRecord => Object.values(inputRecord).filter(inputData => !inputData.parent)),
        ).subscribe(inputData => this._fileDataInput = inputData);

        // When `fileDataInput` changes, rebuild the tree
        stateRef.get("fileDataInput").subscribe((dataInput) => {
            this.filesDataSource.data = dataInput;

            const findRootNode = (nodes: FileTreeNode[]): FileTreeNode | undefined => {
                return nodes.reduce<FileTreeNode | undefined>((rootDirNode, node) => {
                    if (rootDirNode) {
                        return rootDirNode;
                    }
                    
                    if (this.importRequest.modSubdirRoot.toLowerCase().includes(node.fullPath.toLowerCase())) {
                        if (node.fullPath.toLowerCase() === this.importRequest.modSubdirRoot.toLowerCase()) {
                            return node;
                        } else if (!!node.children) {
                            return findRootNode(node.children);
                        }
                    }

                    return undefined;
                }, undefined);
            };

            // Find the root data dir node (if there is one) and expand it
            let rootDirNode = findRootNode(dataInput);
            while (rootDirNode) {
                this.treeControl.expand(rootDirNode);
                rootDirNode = rootDirNode.parent;
            }
        });

        // Add a validator for ensuring at least 1 file is selected
        stateRef.get("form").pipe(
            filterDefined()
        ).subscribe(({ form }) => form.addValidators([this._validateFilesEnabled]));

        // Check if this mod is using a script extender
        combineLatest(stateRef.getAll(
            "gameDetails",
            "importRequest"
        )).pipe(
            filter(([gameDetails, importRequest]) => !importRequest.root && !!gameDetails?.scriptExtenders?.length),
            map(([
                gameDetails, { 
                modFilePaths,
                filePathSeparator,
                modSubdirRoot
            }]) => gameDetails!.scriptExtenders!.find(scriptExtender => scriptExtender.modPaths.some((seModPath) => {
                seModPath = this.normalizePath(seModPath, filePathSeparator, modSubdirRoot);
                return modFilePaths.some(({ filePath }) => {
                    return this.normalizePath(filePath, filePathSeparator, modSubdirRoot).startsWith(seModPath);
                });
            })))
        ).subscribe(detectedScriptExtender => this._detectedScriptExtender = detectedScriptExtender);

        // Warn user if a mod uses a script extender they don't appear to be using
        combineLatest(stateRef.getAll("detectedScriptExtender", "activeProfile")).pipe(
            filter(([detectedScriptExtender, activeProfile]) => !!detectedScriptExtender && AppProfile.isFullProfile(activeProfile)),
            take(1),
            switchMap(([scriptExtender]) => {
                const gameBinaryPath = this.normalizePath(this.activeProfile!.gameBinaryPath, "/");
                const usingScriptExtender = scriptExtender!.binaries.find(binary => gameBinaryPath.endsWith(this.normalizePath(binary, "/")));

                if (!usingScriptExtender) {
                    return dialogManager.createDefault(
                        `This mod requires the script extender ${scriptExtender!.name}, but the active profile does not appear to be set up to use it. \n\nAre you sure you want to continue?`
                    );
                } else {
                    return EMPTY;
                }
            })
        ).subscribe((action) => {
            if (action === DialogManager.CANCEL_ACTION) {
                this.importRequest.importStatus = "CANCELED";
                this.onFormSubmit$.next(this.form);
            }
        });

        // Warn user if a mod uses plugins and plugins aren't enabled
        stateRef.get("importRequest").pipe(
            filterDefined(),
            take(1),
            switchMap((importRequest) => {
                if (importRequest.modPlugins.length > 0 && !this.isPluginsEnabled) {
                    const ACTION_ENABLE_PLUGINS: DialogAction = {
                        label: "Enable",
                        accent: true,
                        tooltip: "Enable plugins"
                    };
                    const ACTION_IGNORE: DialogAction = {
                        label: "Ignore",
                        tooltip: "Ignore warning (NOTE: This mod will likely not work correctly!)"
                    };
                    
                    return dialogManager.createDefault(
                        `This mod has plugins, but plugins are not currently enabled.`,
                        [ACTION_ENABLE_PLUGINS, DialogManager.CANCEL_ACTION_ACCENT, ACTION_IGNORE]
                    ).pipe(
                        tap((action) => {
                            switch (action) {
                                case ACTION_ENABLE_PLUGINS: {
                                    appStateMgmt.setPluginsEnabled(true);
                                    break;
                                }
                                case DialogManager.CANCEL_ACTION_ACCENT: {
                                    this.importRequest.importStatus = "CANCELED";
                                    this.onFormSubmit$.next(this.form);
                                    break;
                                }
                            }
                        })
                    );
                } else {
                    return EMPTY;
                }
            })
        ).subscribe();
    }

    public get detectedScriptExtender(): GameDetails.ScriptExtender | undefined {
        return this._detectedScriptExtender;
    }

    public get fileDataInput(): FileTreeNode[] {
        return this._fileDataInput;
    }

    public writeValue(importRequest: ModImportRequest): void {
        this.importRequest = importRequest;
    }

    public registerOnChange(fn: (importRequest: ModImportRequest) => void): void {
        this.importRequestChange$.subscribe(fn);
    }

    public registerOnTouched(_fn: any): void {
        throw new Error("Method not implemented.");
    }

    /**
     * @description Determines whether or not `node` is the root dir node. If `nestedCheck` is true,
     * it will also return `true` if `node` is a nested child of the root dir node.
     */
    protected isRootDirNode(node: FileTreeNode, nestedCheck = false): boolean {
        return nestedCheck
            ? node.fullPath.toLowerCase().includes(this.importRequest.modSubdirRoot.toLowerCase())
            : node.fullPath.toLowerCase() === this.importRequest.modSubdirRoot.toLowerCase();
    }

    /**
     * @description Determines whether or not the mod file for the given `node` is enabled.
     */
    protected isNodeEnabled$(node: FileTreeNode): Observable<boolean> {
        return node.enabled$.pipe(
            map(enabled => enabled && this.isRootDirNode(node, true))
        );
    }

    /**
     * @description Enables or disables the mod file for the given `node`.
     */
    protected setModFileEnabled(node: FileTreeNode, enabled: boolean): void {
        // Update the `node` enabled status
        node.enabled$.next(enabled);

        // Update the `node` children enabled status
        node.children?.forEach(childNode => this.setModFileEnabled(childNode, enabled));

        // Update the mod file status in `importRequest`
        const modPath = this.importRequest.modFilePaths.find(({ filePath }) => filePath === node.fullPath);
        if (modPath) {
            modPath.enabled = enabled;
        }

        // Update form validation
        this.form.form.updateValueAndValidity();
    }

    /**
     * @description Makes `modSubdirRoot` the new root dir.
     */
    protected setModRootSubdir(modSubdirRoot: string): void {
        this.importRequest = Object.assign(this.importRequest, { modSubdirRoot });
    }

    private normalizePath(path: string, sep: string, modSubdirRoot?: string): string {
        return path
            .toLowerCase()
            .replace(/[/\\]/g, sep)
            .replace(modSubdirRoot ? `${this.normalizePath(modSubdirRoot, sep)}${sep}` : "", "");
    }
}
