import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PortalModule } from "@angular/cdk/portal";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatStepperModule } from "@angular/material/stepper";
import { MatRadioModule } from "@angular/material/radio";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { AppValueCheckboxComponentModule } from "../value-checkbox";
import { AppModInstallerComponent } from "./mod-installer.component";
import { AppPluginGroupValidator } from "./plugin-group-validator.directive";
import { AppResolveDefaultModInstallerPluginPipe } from "./resolve-default-mod-installer-plugin.pipe";
import { AppResolveDefaultModInstallerPluginsPipe } from "./resolve-default-mod-installer-plugins.pipe";
import { AppPipesModule } from "../../pipes";

const PIPES = [
    AppResolveDefaultModInstallerPluginPipe,
    AppResolveDefaultModInstallerPluginsPipe
];

@NgModule({
    declarations: [
        AppModInstallerComponent,
        AppPluginGroupValidator,
        ...PIPES
    ],
    imports: [
        CommonModule,
        FormsModule,

        PortalModule,

        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatRadioModule,
        MatTooltipModule,
        MatStepperModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatCardModule,
        MatProgressSpinnerModule,

        AppPipesModule,

        AppValueCheckboxComponentModule
    ],
    exports: [
        AppModInstallerComponent,
        AppPluginGroupValidator,
        ...PIPES
    ],
    providers: PIPES
})
export class AppModInstallerComponentModule { }
