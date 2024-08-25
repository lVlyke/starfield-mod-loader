import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppPipesModule } from "../../pipes";
import { AppGameBadgeComponent } from "./game-badge.component";

@NgModule({
    declarations: [
        AppGameBadgeComponent
    ],
    imports: [
        CommonModule,

        AppPipesModule
    ],
    exports: [
        AppGameBadgeComponent
    ]
})
export class AppGameBadgeComponentModule { }
