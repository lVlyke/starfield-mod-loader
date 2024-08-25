import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { AppExternalUrlComponent } from "./external-url.component";


@NgModule({
    declarations: [
        AppExternalUrlComponent
    ],
    imports: [
        CommonModule,

        MatButtonModule
    ],
    exports: [
        AppExternalUrlComponent
    ]
})
export class AppExternalUrlComponentModule { }
