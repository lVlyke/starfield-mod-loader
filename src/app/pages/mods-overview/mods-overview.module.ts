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
import { AppModsOverviewPage } from "./mods-overview.page";
import { AppProfileModListComponentModule } from "../../components/profile-mod-list";
import { AppProfileManualModListComponentModule } from "../../components/profile-manual-mod-list";
import { MatButtonModule } from "@angular/material/button";
import { AppPipesModule } from "../../pipes";
import { MatFormFieldModule } from "@angular/material/form-field";

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

        AppPipesModule,

        AppProfileModListComponentModule,
        AppProfileManualModListComponentModule
    ],
    providers: []
})
export class AppModsOverviewPageModule { }