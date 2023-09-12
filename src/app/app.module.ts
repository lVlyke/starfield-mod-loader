import { APP_INITIALIZER, NgModule, Provider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMaterialThemingModule } from "@lithiumjs/ngx-material-theming";

const STARTUP_SERVICES: Provider[] = [];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxMaterialThemingModule,
  ],
  providers: [
    // Startup services:
    {
      provide: APP_INITIALIZER,
      useFactory: APP_INITIALIZER_FACTORY,
      deps: STARTUP_SERVICES,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function APP_INITIALIZER_FACTORY() {
  return function () {};
}
