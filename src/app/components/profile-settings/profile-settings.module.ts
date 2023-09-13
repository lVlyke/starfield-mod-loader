import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { AppProfileSettingsComponent } from "./profile-settings.component";

@NgModule({
    declarations: [
        AppProfileSettingsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
    ],
    exports: [
        AppProfileSettingsComponent
    ]
})
export class AppProfileSettingsComponentModule { }
