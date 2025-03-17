import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild, forwardRef, Output } from "@angular/core";
import { NgModel, FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatFormField, MatLabel, MatSuffix, MatPrefix, MatError } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatIconButton } from "@angular/material/button";
import { ComponentState, ComponentStateRef, DeclareState } from "@lithiumjs/angular";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { BaseComponent } from "../../core/base-component";
import { AppProfile } from "../../models/app-profile";
import { ElectronUtils } from "../../util/electron-utils";
import { filterDefined, runOnce } from "../../core/operators";
import { AppProfileFormField } from "../../models/app-profile-form-field";

@Component({
    selector: "app-profile-form-field",
    templateUrl: "./profile-form-field.component.html",
    styleUrls: ["./profile-form-field.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,

        CdkTrapFocus,

        MatIcon,
        MatTooltip,
        MatFormField,
        MatLabel,
        MatInput,
        MatSuffix,
        MatIconButton,
        MatPrefix,
        MatError
    ],
    providers: [
        ComponentState.create(AppProfileFormFieldComponent),
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppProfileFormFieldComponent),
            multi: true
        }
    ]
})
export class AppProfileFormFieldComponent<T> extends BaseComponent implements ControlValueAccessor {

    @Output("valueChange")
    public readonly valueChange$;

    @ViewChild("fieldModel", { read: NgModel, static: true })
    public readonly fieldModel?: NgModel;

    @Input()
    public field!: AppProfileFormField<T>;

    @Input()
    public disabled: boolean = false;

    @DeclareState()
    public value?: T;

    constructor(
        cdRef: ChangeDetectorRef,
        stateRef: ComponentStateRef<AppProfileFormFieldComponent<T>>
    ) {
        super({ cdRef });

        this.valueChange$ = stateRef.emitter("value");
    }

    public writeValue(value: T | null | undefined): void {
        this.value = value !== null ? value : undefined;
    }

    public registerOnChange(fn: (value: T) => void): void {
        this.valueChange$.subscribe(fn);
    }

    public registerOnTouched(fn: any): void {
        // TODO
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
}
