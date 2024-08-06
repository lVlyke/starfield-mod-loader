import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { provideStore } from "@ngxs/store";
import { withNgxsReduxDevtoolsPlugin } from "@ngxs/devtools-plugin";
import { environment } from "./environments/environment";
import { APP_ROUTES } from "./app/app.routes";
import { AppComponent } from "./app/app.component";
import { appStates } from "./app/state";


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
      provideAnimations(),
      provideStore(
        appStates,
        { developmentMode: !environment.production },
        withNgxsReduxDevtoolsPlugin({ disabled: environment.production})
      ),
      provideRouter(APP_ROUTES)
  ]
}).catch(err => console.log(err));