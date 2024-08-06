import { Routes } from "@angular/router";

export const APP_ROUTES: Routes = [
    {
        path: "",
        redirectTo: "mods-overview",
        pathMatch: "full"
    },
    {
        path: "mods-overview",
        loadChildren: async () => (await import("./pages/mods-overview/mods-overview.module")).AppModsOverviewPageModule
    },
];