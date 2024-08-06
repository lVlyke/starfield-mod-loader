import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppPreferencesComponent } from "./app-preferences.component";

@NgModule({
    declarations: [
        AppPreferencesComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
    exports: [
        AppPreferencesComponent
    ]
})
export class AppPreferencesComponentModule { }
