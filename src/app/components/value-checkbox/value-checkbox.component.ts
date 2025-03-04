import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, Output, ViewChild } from "@angular/core";
import { ControlValueAccessor, FormControlDirective, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ComponentState, ComponentStateRef, DeclareState } from "@lithiumjs/angular";
import { map, skip } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";

@Component({
    selector: "app-value-checkbox",
    templateUrl: "./value-checkbox.component.html",
    styleUrls: ["./value-checkbox.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppValueCheckboxComponent),
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppValueCheckboxComponent),
            multi: true
        }
    ],
    standalone: false
})
export class AppValueCheckboxComponent<T> extends BaseComponent implements ControlValueAccessor {

    public readonly isChecked$ = this.stateRef.get("value").pipe(
        map(([, checked]) => checked)
    );

    @Output("valueChange")
    public readonly valueChange$ = new EventEmitter<AppValueCheckboxComponent.Value<T | undefined>>();

    @Output("checked")
    public readonly checked$ = new EventEmitter<void>();

    @Output("unchecked")
    public readonly unchecked$ = new EventEmitter<void>();

    @Input()
    public value: AppValueCheckboxComponent.Value<T | undefined> = [undefined, false];

    @Input()
    public indeterminate = false;

    @Input()
    @DeclareState()
    public disabled?: boolean;

    @ViewChild(FormControlDirective, { static: true })
    public formControlDirective!: FormControlDirective;

    constructor(
        cdRef: ChangeDetectorRef,
        public readonly stateRef: ComponentStateRef<AppValueCheckboxComponent<T>>
    ) {
        super({ cdRef });

        stateRef.get("value").pipe(
            skip(1)
        ).subscribe((value) => {
            this.valueChange$.emit(value);
            
            if (value[1]) {
                this.checked$.emit();
            } else {
                this.unchecked$.emit();
            }
        });
    }

    public get checked(): boolean {
        return this.value[1];
    }

    public writeValue(value: AppValueCheckboxComponent.Value<T>): void {
        this.value = value;
    }

    public registerOnChange(fn: (value: AppValueCheckboxComponent.Value<T | undefined>) => void): void {
        this.valueChange$.subscribe(fn);
    }

    public registerOnTouched(fn: any): void {
        this.formControlDirective?.valueAccessor?.registerOnTouched(fn);
    }
}

export namespace AppValueCheckboxComponent {

    export type Value<T> = [T, boolean];
}