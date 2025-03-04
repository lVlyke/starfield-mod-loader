import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ViewChild } from "@angular/core";
import { AfterViewInit, ComponentState, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { EMPTY, Observable, of } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";
import { AppModInstallerComponent, AppModInstallerComponentModule } from "../../components/mod-installer";
import { ModImportRequest } from "../../models/mod-import-status";
import { AppPipesModule } from "../../pipes";
import { DialogManager } from "../../services/dialog-manager";
import { AppDialogs } from "../../services/app-dialogs";
import { AppExternalUrlComponentModule } from "../../components/external-url";

@Component({
    templateUrl: "./mod-installer.modal.html",
    styleUrls: ["./mod-installer.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModInstallerModal),
    ],
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        AppPipesModule,
        AppModInstallerComponentModule,
        AppExternalUrlComponentModule
    ]
})
export class AppModInstallerModal extends BaseComponent {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);

    @DeclareState()
    public importRequest!: ModImportRequest;

    @ViewChild(AppModInstallerComponent)
    public readonly installerComponent!: AppModInstallerComponent;

    @AfterViewInit()
    public readonly afterViewInit$!: Observable<void>;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        appDialogs: AppDialogs,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            switchMap(() => this.installerComponent.onFormSubmit$),
            filter(form => !!form.valid),
            switchMap((form) => {
                // Make sure at least one file is selected for install
                if (Object.keys(this.importRequest.modFilePathMapFilter ?? {}).length > 0) {
                    return of(form);
                } else {
                    return appDialogs.showDefault("No files are active for this mod. Do you want to install it anyway?", [
                        DialogManager.YES_ACTION,
                        DialogManager.NO_ACTION_PRIMARY
                    ]).pipe(switchMap(continueInstall => continueInstall ? of(form) : EMPTY));
                }
            })
        ).subscribe((form) => {
            this.onFormSubmit$.next(form);
            overlayRef.close();
        });
    }

    protected cancelAndManuallyInstall(): void {
        this.importRequest.importStatus = "MANUALINSTALL";

        this.overlayRef.close().subscribe(() => {
            delete this.importRequest.modFilePathMapFilter;
        });
    }
}
