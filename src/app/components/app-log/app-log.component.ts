import _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { ComponentState, OnDestroy } from "@lithiumjs/angular";
import { Observable } from "rxjs";
import { Hook, LogLevel, LogMessage } from "electron-log";
import { BaseComponent } from "../../core/base-component";
import { log } from "../../util/logger";

interface LogEntry {
    level: LogLevel;
    text: string;
    timestamp: Date
}

@Component({
    selector: "app-log",
    templateUrl: "./app-log.component.html",
    styleUrls: ["./app-log.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ComponentState.create(AppLogComponent),
    ],
    standalone: false
})
export class AppLogComponent extends BaseComponent {

    protected readonly logHistory: LogEntry[] = [];

    private readonly logHook: Hook = (message: LogMessage): LogMessage => {
        this.logHistory.push({
            level: message.level,
            text: this.formatLogData(message.data),
            timestamp: message.date
        });
        this.cdRef.markForCheck();
        return message;
    };

    @OnDestroy()
    private readonly onDestroy$!: Observable<void>;

    constructor(private readonly cdRef: ChangeDetectorRef) {
        super({ cdRef });

        log.hooks.push(this.logHook);

        this.onDestroy$.subscribe(() => _.remove<Hook>(log.hooks, this.logHook));
    }

    private formatLogData(logData?: any[]): string {
        return logData?.map(data => typeof data === "object" ? JSON.stringify(data) : data.toString()).join(" ") ?? "";
    }
}
