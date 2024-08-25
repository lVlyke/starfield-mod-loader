import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppDialogActionsComponent } from "./dialog-actions.component";

@NgModule({
    declarations: [
        AppDialogActionsComponent
    ],
    imports: [
        CommonModule,

        MatButtonModule,
        MatTooltipModule
    ],
    exports: [
        AppDialogActionsComponent
    ]
})
export class AppDialogActionsComponentModule { }
