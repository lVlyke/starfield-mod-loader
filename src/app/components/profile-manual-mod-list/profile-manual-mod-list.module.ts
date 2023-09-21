import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AppProfileManualModListComponent } from "./profile-manual-mod-list.component";
import { AppPipesModule } from "../../pipes";

@NgModule({
    declarations: [
        AppProfileManualModListComponent
    ],
    imports: [
        CommonModule,

        MatListModule,
        MatCheckboxModule,
        MatIconModule,
        MatTooltipModule,

        AppPipesModule
    ],
    exports: [
        AppProfileManualModListComponent
    ]
})
export class AppProfileManualModListComponentModule { }
