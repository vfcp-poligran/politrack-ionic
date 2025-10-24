import { enableProdMode, importProvidersFrom, APP_INITIALIZER, inject } from '@angular/core'; // Añadido APP_INITIALIZER, inject
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { DatabaseService } from './app/core/services/database.service'; // Importar DatabaseService

if (environment.production) {
  enableProdMode();
}

// Factory function for APP_INITIALIZER
export function initializeDatabaseFactory(databaseService: DatabaseService): () => Promise<void> {
  return () => databaseService.init();
}


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicStorageModule.forRoot()),
    provideIonicAngular(),
    provideRouter(routes),
    // Proveedor APP_INITIALIZER para inicializar DatabaseService
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDatabaseFactory,
      deps: [DatabaseService], // Dependencia del factory
      multi: true // Necesario para APP_INITIALIZER
    }
  ],
});
