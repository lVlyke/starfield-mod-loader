import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DragDropModule } from "@angular/cdk/drag-drop"
import { PortalModule } from "@angular/cdk/portal";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AppProfilePluginListComponent } from "./profile-plugin-list.component";
import { AppPipesModule } from "../../pipes";

@NgModule({
    declarations: [
        AppProfilePluginListComponent
    ],
    imports: [
        CommonModule,

        DragDropModule,
        PortalModule,

        MatButtonModule,
        MatTableModule,
        MatCheckboxModule,
        MatIconModule,
        MatTooltipModule,
        MatCardModule,
        MatListModule,
        MatSelectModule,
        MatFormFieldModule,

        AppPipesModule
    ],
    exports: [
        AppProfilePluginListComponent
    ]
})
export class AppProfilePluginListComponentModule { }
