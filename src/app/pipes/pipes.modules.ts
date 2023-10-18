import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppProfileActiveModCountPipe } from "./profile-active-mod-count.pipe";
import { AppGameTitlePipe } from "./game-title.pipe";
import { AppSendElectronMsgPipe } from "./send-electron-msg.pipe";
import { AppValuesPipe } from "./values.pipe";
import { AppFlattenPipe } from "./flatten.pipe";
import { AppExternalImagePipe } from "./external-image.pipe";
import { AppModImportRequestImagePipe } from "./mod-import-request-image.pipe";
import { AppDelayPipe } from "./delay.pipe";
import { AppFilterDefinedPipe } from "./filter-defined.pipe";
import { AppAsObservablePipe } from "./as-observable.pipe";

const PIPES = [
    AppProfileActiveModCountPipe,
    AppGameTitlePipe,
    AppSendElectronMsgPipe,
    AppValuesPipe,
    AppFlattenPipe,
    AppExternalImagePipe,
    AppModImportRequestImagePipe,
    AppDelayPipe,
    AppFilterDefinedPipe,
    AppAsObservablePipe
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
