import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: "",
    redirectTo: "mods-overview"
  },
  {
      path: "mods-overview",
      loadChildren: async () => (await import("./pages/mods-overview/mods-overview.module")).AppModsOverviewPageModule
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
