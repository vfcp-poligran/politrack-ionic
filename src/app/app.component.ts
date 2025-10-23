import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { HistoryService } from './core/services';
import { DatabaseService } from './core/services/database.service'; // <-- 1. Importar DatabaseService
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  private historyService = inject(HistoryService);
  private databaseService = inject(DatabaseService); // <-- 2. Inyectar DatabaseService
  private platform = inject(Platform); // <-- 3. Inyectar Platform

  constructor() {
    this.historyService.startTracking();
    this.initializeApp(); // <-- 4. Llamar al inicializador asíncrono
  }

  /**
   * Inicializa la aplicación, esperando que la plataforma esté lista
   * e inicializando la base de datos antes de ocultar el splash screen.
   */
  async initializeApp() {
    try {
      // Esperar a que la plataforma (nativo o web) esté lista
      await this.platform.ready();
      console.log('Platform is ready.');

      // 5. Inicializar la base de datos (SQLite o Ionic Storage)
      const dbInitialized = await this.databaseService.init();

      if (dbInitialized) {
        console.log('Database initialized successfully.');
      } else {
        console.error('FATAL: Database initialization failed.');
        // Aquí podrías mostrar un error fatal al usuario
      }

      // 6. Configuración nativa (solo se ejecuta en móvil)
      if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ style: Style.Default });
        await SplashScreen.hide(); // Ocultar splash solo después de que todo esté listo
        console.log('Splash screen hidden and Status bar style set.');
      }

    } catch (error) {
      console.error('CRITICAL: Error during app initialization:', error);
      // Manejar el error de inicialización (ej. mostrar alerta)
      if (Capacitor.isNativePlatform()) {
         await SplashScreen.hide(); // Ocultar splash incluso si hay error para no bloquear
      }
    }
  }
}
