import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, ViewChild } from "@angular/core";
import { AfterViewInit, ComponentState, DeclareState } from "@lithiumjs/angular";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Observable } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { AppProfileSettingsComponent, AppProfileSettingsComponentModule } from "../../components/profile-settings";
import { OverlayHelpersRef, OverlayRefSymbol } from "../../services/overlay-helpers";

@Component({
    templateUrl: "./profile-settings.modal.html",
    styleUrls: ["./profile-settings.modal.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppProfileSettingsModal),
    ],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        MatCardModule,
        MatButtonModule,
        
        AppProfileSettingsComponentModule
    ]
})
export class AppProfileSettingsModal extends BaseComponent {

    @DeclareState()
    public profile!: AppProfile;

    @ViewChild(AppProfileSettingsComponent)
    protected readonly profileSettingsComponent!: AppProfileSettingsComponent;

    @AfterViewInit()
    private readonly afterViewInit$!: Observable<void>;

    constructor(
        @Inject(OverlayRefSymbol) public readonly overlayRef: OverlayHelpersRef,
        cdRef: ChangeDetectorRef
    ) {
        super({ cdRef });

        this.afterViewInit$.pipe(
            switchMap(() => this.profileSettingsComponent.onFormSubmit$),
            filter(form => !!form.valid),
        ).subscribe(() => overlayRef.close());
    }
}
