import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { AppModsOverviewPage } from "./mods-overview.page";
import { AppProfileModListComponentModule } from "../../components/profile-mod-list";

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

        MatCardModule,

        AppProfileModListComponentModule
    ],
    providers: []
})
export class AppModsOverviewPageModule { }