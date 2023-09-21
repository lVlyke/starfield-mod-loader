import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ViewChild } from "@angular/core";
import { AfterViewInit, ComponentState, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Observable } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";
import { AppModImportOptionsComponent, AppModImportOptionsComponentModule } from "../../components/mod-import-options";
import { ModImportRequest } from "../../models/mod-import-status";

@Component({
    templateUrl: "./mod-import-options.modal.html",
    styleUrls: ["./mod-import-options.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppModImportOptionsModal),
    ],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        MatCardModule,
        MatButtonModule,
        
        AppModImportOptionsComponentModule
    ]
})
export class AppModImportOptionsModal extends BaseComponent {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);

    @DeclareState()
    public importRequest!: ModImportRequest;

    @ViewChild(AppModImportOptionsComponent)
    public readonly importOptionsComponent!: AppModImportOptionsComponent;

    @AfterViewInit()
    public readonly afterViewInit$!: Observable<void>;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            switchMap(() => this.importOptionsComponent.onFormSubmit$),
            filter(form => !!form.valid),
        ).subscribe((form) => {
            this.onFormSubmit$.next(form);
            overlayRef.close();
        });
    }
}
