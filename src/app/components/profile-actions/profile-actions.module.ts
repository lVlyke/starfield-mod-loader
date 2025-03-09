import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PortalModule } from "@angular/cdk/portal";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { AppPipesModule } from "../../pipes";
import { AppProfileActionsComponent } from "./profile-actions.component";

@NgModule({
    declarations: [
        AppProfileActionsComponent
    ],
    imports: [
        CommonModule,

        PortalModule,

        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatCardModule,
        MatListModule,

        AppPipesModule
    ],
    exports: [
        AppProfileActionsComponent
    ]
})
export class AppProfileActionsComponentModule { }
