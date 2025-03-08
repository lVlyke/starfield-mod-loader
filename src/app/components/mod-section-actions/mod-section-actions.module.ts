import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { AppModSectionActionsComponent } from "./mod-section-actions.component";

@NgModule({
    declarations: [
        AppModSectionActionsComponent
    ],
    imports: [
        CommonModule,

        MatListModule,
        MatIconModule
    ],
    exports: [
        AppModSectionActionsComponent
    ]
})
export class AppModSectionActionsComponentModule { }
