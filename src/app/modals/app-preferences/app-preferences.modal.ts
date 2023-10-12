import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ViewChild } from "@angular/core";
import { AfterViewInit, ComponentState, DeclareState, ManagedSubject } from "@lithiumjs/angular";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { Observable } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppData } from "../../models/app-data";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";
import { AppPreferencesComponent, AppPreferencesComponentModule } from "../../components/app-preferences";

@Component({
    templateUrl: "./app-preferences.modal.html",
    styleUrls: ["./app-preferences.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppPreferencesModal),
    ],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        MatCardModule,
        MatButtonModule,
        MatDividerModule,
        
        AppPreferencesComponentModule
    ]
})
export class AppPreferencesModal extends BaseComponent {

    public readonly onFormSubmit$ = new ManagedSubject<NgForm>(this);

    @DeclareState()
    public preferences?: AppData;

    @ViewChild(AppPreferencesComponent)
    public readonly preferencesComponent!: AppPreferencesComponent;

    @AfterViewInit()
    public readonly afterViewInit$!: Observable<void>;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            switchMap(() => this.preferencesComponent.onFormSubmit$),
            filter(form => !!form.valid),
        ).subscribe((form) => {
            this.onFormSubmit$.next(form);
            overlayRef.close();
        });
    }
}
