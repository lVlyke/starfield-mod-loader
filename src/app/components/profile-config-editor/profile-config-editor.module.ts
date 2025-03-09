import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppPipesModule } from "../../pipes";
import { AppProfileConfigEditorComponent } from "./profile-config-editor.component";

@NgModule({
    declarations: [
        AppProfileConfigEditorComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatTooltipModule,

        AppPipesModule
    ],
    exports: [
        AppProfileConfigEditorComponent
    ]
})
export class AppProfileConfigEditorComponentModule { }
