import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  constructor() { }

  /**
   * Inicia el seguimiento del historial.
   */
  startTracking(): void {
    // Implementación de ejemplo, puedes agregar lógica real aquí
    console.log('History tracking started.');
  }
}
