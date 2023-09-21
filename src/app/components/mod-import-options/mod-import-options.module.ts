import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTreeModule } from "@angular/material/tree";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppModImportOptionsComponent } from "./mod-import-options.component";

@NgModule({
    declarations: [
        AppModImportOptionsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
    exports: [
        AppModImportOptionsComponent
    ]
})
export class AppModImportOptionsComponentModule { }
