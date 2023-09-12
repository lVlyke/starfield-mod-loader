import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BaseComponent } from './core/base-component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends BaseComponent {

    constructor (cdRef: ChangeDetectorRef) {
        super({ cdRef });
    }
}
