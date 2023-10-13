import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppProfileActiveModCountPipe } from "./profile-active-mod-count.pipe";
import { AppGameTitlePipe } from "./game-title.pipe";
import { AppSendElectronMsgPipe } from "./send-electron-msg.pipe";
import { AppValuesPipe } from "./values.pipe";
import { AppFlattenPipe } from "./flatten.pipe";

const PIPES = [
    AppProfileActiveModCountPipe,
    AppGameTitlePipe,
    AppSendElectronMsgPipe,
    AppValuesPipe,
    AppFlattenPipe
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
