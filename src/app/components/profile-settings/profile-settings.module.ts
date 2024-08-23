import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { A11yModule } from "@angular/cdk/a11y";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatExpansionModule } from "@angular/material/expansion";
import { AppProfileSettingsComponent } from "./profile-settings.component";
import { AppPipesModule } from "../../pipes";
import { AppGameBadgeComponentModule } from "../game-badge/game-badge.module";
import { AppProfileSettingsStandardPathFieldsPipe } from "./profile-standard-path-fields.pipe";

@NgModule({
    declarations: [
        AppProfileSettingsComponent,
        AppProfileSettingsStandardPathFieldsPipe
    ],
    imports: [
        CommonModule,
        FormsModule,

        A11yModule,
        
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatExpansionModule,

        AppPipesModule,
        AppGameBadgeComponentModule
    ],
    exports: [
        AppProfileSettingsComponent
    ]
})
export class AppProfileSettingsComponentModule { }
