import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Solo registrar jeep-sqlite si estamos en web y si está disponible
if (Capacitor.getPlatform() === 'web') {
  try {
    import('jeep-sqlite/loader').then(({ defineCustomElements }) => {
      defineCustomElements(window);
    }).catch(() => {
      console.log('jeep-sqlite no disponible, usando solo Ionic Storage');
    });
  } catch (error) {
    console.log('jeep-sqlite no disponible');
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    importProvidersFrom(IonicStorageModule.forRoot()),
  ],
});
