import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DragDropModule } from "@angular/cdk/drag-drop"
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppProfileModListComponent } from "./profile-mod-list.component";
import { AppPipesModule } from "../../pipes";

@NgModule({
    declarations: [
        AppProfileModListComponent
    ],
    imports: [
        CommonModule,

        DragDropModule,

        MatButtonModule,
        MatTableModule,
        MatCheckboxModule,
        MatIconModule,
        MatTooltipModule,

        AppPipesModule
    ],
    exports: [
        AppProfileModListComponent
    ]
})
export class AppProfileModListComponentModule { }
