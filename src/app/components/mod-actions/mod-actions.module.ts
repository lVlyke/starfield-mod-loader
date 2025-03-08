import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PortalModule } from "@angular/cdk/portal";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { AppModActionsComponent } from "./mod-actions.component";

@NgModule({
    declarations: [
        AppModActionsComponent
    ],
    imports: [
        CommonModule,

        PortalModule,

        MatCardModule,
        MatListModule,
        MatIconModule
    ],
    exports: [
        AppModActionsComponent
    ]
})
export class AppModActionsComponentModule { }
