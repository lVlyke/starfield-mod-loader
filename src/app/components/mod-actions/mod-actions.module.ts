import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { AppModActionsComponent } from "./mod-actions.component";

@NgModule({
    declarations: [
        AppModActionsComponent
    ],
    imports: [
        CommonModule,

        MatListModule,
        MatIconModule
    ],
    exports: [
        AppModActionsComponent
    ]
})
export class AppModActionsComponentModule { }
