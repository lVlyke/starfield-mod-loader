import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppValueCheckboxComponent } from "./value-checkbox.component";
import { AppValueCheckboxGroupComponent } from "./group/value-checkbox-group.component";
import { FormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";

@NgModule({
    declarations: [
        AppValueCheckboxComponent,
        AppValueCheckboxGroupComponent
    ],
    imports: [
        CommonModule,
        FormsModule,

        MatCheckboxModule
    ],
    exports: [
        AppValueCheckboxComponent,
        AppValueCheckboxGroupComponent
    ]
})
export class AppValueCheckboxComponentModule { }
