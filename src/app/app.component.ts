import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './core/services/database.service';
import { StorageService } from './core/services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private databaseService = inject(DatabaseService);
  private storageService = inject(StorageService);

  async ngOnInit() {
    await this.initializeApp();
  }

  /**
   * Inicializa la aplicación y los servicios necesarios
   */
  private async initializeApp(): Promise<void> {
    try {
      console.log('Iniciando POLITrack...');

      // Inicializar Storage
      await this.storageService.init();
      console.log('Storage inicializado');

      // Inicializar Base de Datos
      await this.databaseService.init();
      console.log('Base de datos inicializada');

      console.log('POLITrack iniciado correctamente');
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
    }
  }
}
