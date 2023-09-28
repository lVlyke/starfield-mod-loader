import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from "../environments/environment";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMaterialThemingModule } from "@lithiumjs/ngx-material-theming";
import { NgxsModule } from "@ngxs/store";

import { MatSnackBarModule } from '@angular/material/snack-bar';

import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";

import { appStates } from "./state";

import { ProfileManager } from './services/profile-manager';
import { AppMessageHandler } from './services/app-message-handler';
import { AppStateBehaviorManager } from './services/app-state-behavior-manager';

const STARTUP_SERVICES = [
  AppMessageHandler,
  AppStateBehaviorManager,
  ProfileManager
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxMaterialThemingModule,

    NgxsModule.forRoot(appStates, { developmentMode: !environment.production }),

    MatSnackBarModule,

    // Must be last
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: environment.production })
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
