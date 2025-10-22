import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio de gestión de historial (Undo/Redo)
 */
@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historyBuffer: any[] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 10;

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  public canUndo$ = this.canUndoSubject.asObservable();
  public canRedo$ = this.canRedoSubject.asObservable();

  constructor() {}

  /**
   * Guarda un nuevo estado en el historial
   */
  pushState(state: any): void {
    // Remover estados futuros si estamos en el medio del historial
    this.historyBuffer = this.historyBuffer.slice(0, this.historyIndex + 1);

    // Agregar el nuevo estado
    this.historyBuffer.push(JSON.parse(JSON.stringify(state)));

    // Mantener el tamaño máximo del historial
    if (this.historyBuffer.length > this.MAX_HISTORY) {
      this.historyBuffer.shift();
    } else {
      this.historyIndex++;
    }

    this.updateCanUndoRedo();
  }

  /**
   * Deshace la última acción
   */
  undo(): any | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.updateCanUndoRedo();
      return JSON.parse(JSON.stringify(this.historyBuffer[this.historyIndex]));
    }
    return null;
  }

  /**
   * Rehace la última acción deshecha
   */
  redo(): any | null {
    if (this.historyIndex < this.historyBuffer.length - 1) {
      this.historyIndex++;
      this.updateCanUndoRedo();
      return JSON.parse(JSON.stringify(this.historyBuffer[this.historyIndex]));
    }
    return null;
  }

  /**
   * Actualiza los estados de canUndo y canRedo
   */
  private updateCanUndoRedo(): void {
    this.canUndoSubject.next(this.historyIndex > 0);
    this.canRedoSubject.next(this.historyIndex < this.historyBuffer.length - 1);
  }

  /**
   * Limpia el historial
   */
  clear(): void {
    this.historyBuffer = [];
    this.historyIndex = -1;
    this.updateCanUndoRedo();
  }

  /**
   * Obtiene el estado actual
   */
  getCurrentState(): any | null {
    if (this.historyIndex >= 0 && this.historyIndex < this.historyBuffer.length) {
      return JSON.parse(JSON.stringify(this.historyBuffer[this.historyIndex]));
    }
    return null;
  }

  /**
   * Verifica si se puede deshacer
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Verifica si se puede rehacer
   */
  canRedo(): boolean {
    return this.historyIndex < this.historyBuffer.length - 1;
  }

  /**
   * Obtiene el tamaño del historial
   */
  getHistorySize(): number {
    return this.historyBuffer.length;
  }
}
