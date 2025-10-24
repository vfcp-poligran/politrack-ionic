import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { DatabaseService } from './core/services/database.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule],
})
export class AppComponent {

  // No necesitamos injectar Platform o DatabaseService aquí si usamos APP_INITIALIZER
  // private platform = inject(Platform);
  // private databaseService = inject(DatabaseService);

  constructor() {
    // La inicialización ahora ocurre a través de APP_INITIALIZER en main.ts
    console.log('AppComponent Constructor: La inicialización de la BD debería estar en curso o completada.');
    // this.initializeApp(); // --- CORRECCIÓN: Eliminado ---
  }

  // --- CORRECCIÓN: Método eliminado ---
  // async initializeApp() { ... }
}
