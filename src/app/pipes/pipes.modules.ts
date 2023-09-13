import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppProfileActiveModCountPipe } from "./profile-active-mod-count.pipe";

const PIPES = [
    AppProfileActiveModCountPipe
];

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: PIPES,
    exports: PIPES,
    providers: PIPES
})
export class AppPipesModule { }
