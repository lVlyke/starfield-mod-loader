import _ from "lodash";
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { TitleCasePipe, DatePipe } from "@angular/common";
import { MatIcon } from "@angular/material/icon";
import { ComponentState, OnDestroy } from "@lithiumjs/angular";
import { Observable } from "rxjs";
import { Hook, LogLevel, LogMessage } from "electron-log";
import { environment } from "../../../environments/environment";
import { log } from "../../util/logger";
import { BaseComponent } from "../../core/base-component";

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

    private readonly console = console;

    private readonly logHook: Hook = (message: LogMessage): LogMessage => {
        const logEntry: LogEntry = {
            level: message.level,
            text: this.formatLogData(message.data),
            timestamp: message.date
        };

        if (!environment.production) {
            switch (logEntry.level) {
                case "debug":
                case "verbose": this.console.debug(logEntry.text);
                break;
                case "error": this.console.error(logEntry.text);
                break;
                case "info": this.console.info(logEntry.text);
                break;
                case "warn": this.console.warn(logEntry.text);
                break;
                case "silly":
                default: this.console.log(logEntry.text);
                break;
            }
        }

        this.logHistory.push(logEntry);
        this.cdRef.markForCheck();
        return message;
    };

    @OnDestroy()
    private readonly onDestroy$!: Observable<void>;

    constructor(private readonly cdRef: ChangeDetectorRef) {
        super({ cdRef });

        log.transports.console.level = false;

        log.hooks.push(this.logHook);

        // Intercept all console logs
        console = Object.assign({}, console, {
            log: (...params: any[]) => (log.log(...params)),
            info: (...params: any[]) => (log.info(...params)),
            warn: (...params: any[]) => (log.warn(...params)),
            error: (...params: any[]) => (log.error(...params)),
            debug: (...params: any[]) => (log.debug(...params)),
        });

        this.onDestroy$.subscribe(() => _.remove<Hook>(log.hooks, this.logHook));
    }

    private formatLogData(logData?: any[]): string {
        return logData?.map(data => typeof data === "object" ? JSON.stringify(data) : data.toString()).join(" ") ?? "";
    }
}
