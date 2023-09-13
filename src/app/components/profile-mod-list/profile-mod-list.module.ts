import { NgModule } from "@angular/core";
import { OverlayModule } from "@angular/cdk/overlay";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { AppProfileModListComponent } from "./profile-mod-list.component";
import { CommonModule } from "@angular/common";

@NgModule({
    declarations: [
        AppProfileModListComponent
    ],
    imports: [
        CommonModule,
        OverlayModule,
        MatButtonModule,
        MatListModule,
        MatCheckboxModule,
    ],
    exports: [
        AppProfileModListComponent
    ]
})
export class AppProfileModListComponentModule { }
