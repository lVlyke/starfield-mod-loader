import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppProfileActiveModCountPipe } from "./profile-active-mod-count.pipe";
import { AppGameTitlePipe } from "./game-title.pipe";

const PIPES = [
    AppProfileActiveModCountPipe,
    AppGameTitlePipe
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
