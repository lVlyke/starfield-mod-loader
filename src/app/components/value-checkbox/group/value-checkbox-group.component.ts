import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, forwardRef, Input, QueryList, ViewChild } from "@angular/core";
import { ControlValueAccessor, FormControlDirective, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ComponentState, ComponentStateRef } from "@lithiumjs/angular";
import { merge, zip } from "rxjs";
import { filter, map, skip, switchMap, tap } from "rxjs/operators";
import { BaseComponent } from "../../../core/base-component";
import { AppValueCheckboxComponent } from "../value-checkbox.component";

@Component({
    selector: "app-value-checkbox-group",
    templateUrl: "./value-checkbox-group.component.html",
    styleUrls: ["./value-checkbox-group.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppValueCheckboxGroupComponent),
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppValueCheckboxGroupComponent),
            multi: true
        }
    ],
    standalone: false
})
export class AppValueCheckboxGroupComponent<T> extends BaseComponent implements ControlValueAccessor {

    public readonly value$ = this.stateRef.get("value");

    @Input()
    public value: Array<T | undefined> = [];

    @ViewChild(FormControlDirective, { static: true })
    public formControlDirective!: FormControlDirective;

    @ContentChildren(AppValueCheckboxComponent, { descendants: true })
    public valueCheckboxes!: QueryList<AppValueCheckboxComponent<T>>;

    constructor(
        cdRef: ChangeDetectorRef,
        public readonly stateRef: ComponentStateRef<AppValueCheckboxGroupComponent<T>>
    ) {
        super({ cdRef });

        let ignoreUpdates = false;

        stateRef.get("value").pipe(
            filter(value => !!value),
            filter(() => !ignoreUpdates),
            tap(() => ignoreUpdates = true)
        ).subscribe((values) => {
            this.valueCheckboxes.forEach((valueCheckbox) => {
                valueCheckbox.value = [valueCheckbox.value[0], values.includes(valueCheckbox.value[0]!)];
            });

            ignoreUpdates = false;
        });

        stateRef.get("valueCheckboxes").pipe(
            switchMap((valueCheckboxes) => merge(...valueCheckboxes.map(valueCheckbox => valueCheckbox.stateRef.get("value"))).pipe(
                filter(() => !ignoreUpdates),
                tap(() => ignoreUpdates = true),
                switchMap(() => zip(...valueCheckboxes.map(valueCheckbox => valueCheckbox.stateRef.get("value")))),
                map((checkboxStates) => checkboxStates.filter(([, checked]) => checked)),
                map((filteredStates) => filteredStates.map(([value]) => value))
            ))
        ).subscribe((values) => {
            this.value = values;
            ignoreUpdates = false;
        });
    }

    public writeValue(value: T[] | null | undefined | ""): void {
        this.value = (value || this.value) as any;
    }

    public registerOnChange(fn: (value: Array<T | undefined>) => void): void {
        this.value$.pipe(skip(1)).subscribe(fn);
    }

    public registerOnTouched(fn: any): void {
        this.formControlDirective?.valueAccessor?.registerOnTouched(fn);
    }
}
