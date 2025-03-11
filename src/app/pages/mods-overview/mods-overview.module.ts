import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppModsOverviewPage } from "./mods-overview.page";

const routes: Routes = [
    {
        path: "",
        component: AppModsOverviewPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class AppModsOverviewPageModule { }