import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild, forwardRef, Output, EventEmitter } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { NgForm, FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { GameInstallation } from "../../models/game-installation";
import { AppProfileSettingsComponent } from "../profile-settings";
import { AppGameInstallFieldsPipe } from "./game-install-fields.pipe";
import { AppProfileFormFieldComponent } from "../profile-form-field";

@Component({
    selector: "app-game-install-settings",
    templateUrl: "./game-install-settings.component.html",
    styleUrls: ["./game-install-settings.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AsyncPipe,
        FormsModule,

        MatFormField,
        MatInput,
        MatLabel,
        
        AppProfileFormFieldComponent,
        AppGameInstallFieldsPipe,
    ],
    providers: [
        ComponentState.create(AppGameInstallSettingsComponent),
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppGameInstallSettingsComponent),
            multi: true
        }
    ]
})
export class AppGameInstallSettingsComponent extends BaseComponent implements ControlValueAccessor {

    @Output("valueChange")
    public readonly valueChange$: EventEmitter<Partial<GameInstallation>>;

    @ViewChild(NgForm)
    public readonly form!: NgForm;

    @Input()
    public value: Partial<GameInstallation> = {};

    @Input()
    public custom: boolean = false;

    @Input()
    public disabled: boolean = false;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppGameInstallSettingsComponent>,
        protected readonly profileSettings: AppProfileSettingsComponent
    ) {
        super({ cdRef });

        this.valueChange$ = stateRef.emitter("value");
    }

    public writeValue(value: GameInstallation | null | undefined): void {
        this.value = value ?? {};
    }

    public registerOnChange(fn: (value: Partial<GameInstallation>) => void): void {
        this.valueChange$.subscribe(fn);
    }

    public registerOnTouched(fn: any): void {
    }
}
