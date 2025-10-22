import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * Servicio de almacenamiento local usando Ionic Storage
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage = inject(Storage);
  private _storage: Storage | null = null;

  constructor() {
    this.init();
  }

  /**
   * Inicializa el storage
   */
  async init(): Promise<void> {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  /**
   * Guarda un valor en el storage
   */
  async set(key: string, value: any): Promise<void> {
    await this._storage?.set(key, value);
  }

  /**
   * Obtiene un valor del storage
   */
  async get(key: string): Promise<any> {
    return await this._storage?.get(key);
  }

  /**
   * Elimina un valor del storage
   */
  async remove(key: string): Promise<void> {
    await this._storage?.remove(key);
  }

  /**
   * Limpia todo el storage
   */
  async clear(): Promise<void> {
    await this._storage?.clear();
  }

  /**
   * Obtiene todas las claves del storage
   */
  async keys(): Promise<string[]> {
    return (await this._storage?.keys()) || [];
  }

  /**
   * Obtiene el número de elementos en el storage
   */
  async length(): Promise<number> {
    return (await this._storage?.length()) || 0;
  }
}
