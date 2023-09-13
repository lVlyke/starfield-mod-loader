import { NgModule } from "@angular/core";
import { DragDropModule } from "@angular/cdk/drag-drop"
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

        DragDropModule,

        MatButtonModule,
        MatListModule,
        MatCheckboxModule,
    ],
    exports: [
        AppProfileModListComponent
    ]
})
export class AppProfileModListComponentModule { }
