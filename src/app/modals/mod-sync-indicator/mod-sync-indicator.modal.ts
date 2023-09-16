import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

@Component({
    templateUrl: "./mod-sync-indicator.modal.html",
    styleUrls: ["./mod-sync-indicator.modal.scss"],
    standalone: true,
    imports: [
        CommonModule,

        MatCardModule,
        MatIconModule
    ]
})
export class AppModSyncIndicatorModal {}
