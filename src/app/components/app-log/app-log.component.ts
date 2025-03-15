import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { TitleCasePipe, DatePipe } from "@angular/common";
import { MatIcon } from "@angular/material/icon";
import { ComponentState, OnDestroy } from "@lithiumjs/angular";
import { Observable } from "rxjs";
import { log, LogEntry, LogHook } from "../../util/logger";
import { BaseComponent } from "../../core/base-component";

@Component({
    selector: "app-log",
    templateUrl: "./app-log.component.html",
    styleUrls: ["./app-log.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DatePipe,
        TitleCasePipe,

        MatIcon
    ],
    providers: [
        ComponentState.create(AppLogComponent),
    ]
})
export class AppLogComponent extends BaseComponent {

    protected readonly logHistory: LogEntry[] = [];

    private readonly logHook: LogHook = (logEntry: LogEntry): undefined => {
        this.logHistory.push(logEntry);
        this.cdRef.markForCheck();
        return undefined;
    };

    @OnDestroy()
    private readonly onDestroy$!: Observable<void>;

    constructor(private readonly cdRef: ChangeDetectorRef) {
        super({ cdRef });

        log.addHook(this.logHook);
        this.onDestroy$.subscribe(() => log.removeHook(this.logHook));
    }
}
