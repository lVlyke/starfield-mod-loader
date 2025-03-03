import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { AppLogComponent } from "./app-log.component";

@NgModule({
    declarations: [
        AppLogComponent
    ],
    imports: [
        CommonModule,

        MatIconModule
    ],
    exports: [
        AppLogComponent
    ]
})
export class AppLogComponentModule { }
