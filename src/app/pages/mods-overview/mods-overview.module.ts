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
import { AppModsOverviewPage } from "./mods-overview.page";
import { AppProfileModListComponentModule } from "../../components/profile-mod-list";
import { AppProfilePluginListComponentModule } from "../../components/profile-plugin-list";
import { AppGameBadgeComponentModule } from "../../components/game-badge/game-badge.module";
import { AppPipesModule } from "../../pipes";
import { AppLogComponentModule } from "../../components/app-log";
import { AppProfileSaveListComponent } from "../../components/profile-save-list";
import { AppProfileConfigEditorComponentModule } from "../../components/profile-config-editor";
import { AppProfileActionsComponentModule } from "../../components/profile-actions";

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

        AppPipesModule,

        AppProfileModListComponentModule,
        AppProfilePluginListComponentModule,
        AppGameBadgeComponentModule,
        AppLogComponentModule,
        AppProfileConfigEditorComponentModule,
        AppProfileActionsComponentModule,

        AppProfileSaveListComponent
    ],
    providers: []
})
export class AppModsOverviewPageModule { }