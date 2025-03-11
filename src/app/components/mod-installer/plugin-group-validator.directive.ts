import { ChangeDetectorRef, Directive, Input, forwardRef } from "@angular/core";
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from "@angular/forms";
import { createDirectiveState } from "@lithiumjs/angular";
import { BaseComponent } from "../../core/base-component";
import { AppModInstaller } from "./mod-installer.types";
import { ModInstaller } from "../../models/mod-installer";

const STATE_PROVIDER = createDirectiveState(forwardRef(() => AppPluginGroupValidator));

@Directive({
    selector: "[ngModel][appPluginGroupValidator]",
    providers: [
        STATE_PROVIDER,
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AppPluginGroupValidator),
            multi: true
        }
    ]
})
export class AppPluginGroupValidator extends BaseComponent implements Validator {

    @Input("appPluginGroupValidator")
    public pluginGroup!: AppModInstaller.PluginGroup;

    constructor (cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }

    public validate(control: AbstractControl<AppModInstaller.Plugin | AppModInstaller.Plugin[]>): ValidationErrors | null {
        const activePlugins = Array.isArray(control.value) ? control.value : [control.value];
        const requiredPlugins = this.pluginGroup.plugins.filter(plugin => plugin.type === ModInstaller.PluginType.Name.Required);

        if (!requiredPlugins.every(plugin => activePlugins.includes(plugin))) {
            return { pluginGroup: true, required: true };
        }

        switch (this.pluginGroup.type) {
            case ModInstaller.PluginGroup.Type.SelectAll:
                return this.pluginGroup.plugins.every(plugin => activePlugins.includes(plugin))
                    ? null
                    : { pluginGroup: true, selectAll: true };
            case ModInstaller.PluginGroup.Type.SelectAtLeastOne:
                return activePlugins.length > 0
                    ? null
                    : { pluginGroup: true, selectAtLeastOne: true };
            case ModInstaller.PluginGroup.Type.SelectAtMostOne:
                return activePlugins.length <= 1
                    ? null
                    : { pluginGroup: true, selectAtMostOne: true };
            case ModInstaller.PluginGroup.Type.SelectExactlyOne:
                return activePlugins.length === 1
                    ? null
                    : { pluginGroup: true, selectExactlyOne: true };
            case ModInstaller.PluginGroup.Type.SelectAny:
            default:
                return null;
        }
    }
}
