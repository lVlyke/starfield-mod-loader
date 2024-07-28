import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { PortalModule } from "@angular/cdk/portal";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatListModule } from "@angular/material/list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTabsModule } from "@angular/material/tabs";
import { AppModsOverviewPage } from "./mods-overview.page";
import { AppProfileModListComponentModule } from "../../components/profile-mod-list";
import { AppProfilePluginListComponentModule } from "../../components/profile-plugin-list";
import { AppGameBadgeComponentModule } from "../../components/game-badge/game-badge.module";
import { AppPipesModule } from "../../pipes";

const routes: Routes = [
    {
        path: "",
        component: AppModsOverviewPage
    }
];

@NgModule({
    declarations: [
        AppModsOverviewPage
    ],
    exports: [
        AppModsOverviewPage
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),

        PortalModule,

        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatSelectModule,
        MatFormFieldModule,
        MatListModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        MatTabsModule,

        AppPipesModule,

        AppProfileModListComponentModule,
        AppProfilePluginListComponentModule,
        AppGameBadgeComponentModule
    ],
    providers: []
})
export class AppModsOverviewPageModule { }