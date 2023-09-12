import { Directive } from '@angular/core';
import { BaseComponent } from './base-component';

@Directive()
export abstract class BasePage extends BaseComponent {

    constructor(config: BaseComponent.Config) {
        super(config);
    }
}
