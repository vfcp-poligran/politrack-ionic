import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Servicio de importación y exportación de datos
 */
@Injectable({
  providedIn: 'root'
})
export class ImportExportService {
  constructor() {}

  /**
   * Lee un archivo CSV desde el sistema de archivos
   */
  async readCSVFile(filePath: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      return result.data as string;
    } catch (error) {
      console.error('Error al leer archivo CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta datos a un archivo CSV
   */
  async exportToCSV(data: string, filename: string): Promise<void> {
    try {
      // Escribir archivo
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      console.log('Archivo CSV exportado:', result.uri);

      // Compartir archivo si está en plataforma móvil
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Exportar datos',
          text: 'Compartir archivo CSV',
          url: result.uri,
          dialogTitle: 'Exportar datos'
        });
      } else {
        // En web, descargar el archivo
        this.downloadFile(data, filename, 'text/csv');
      }
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta datos a un archivo JSON
   */
  async exportToJSON(data: any, filename: string): Promise<void> {
    try {
      const jsonData = JSON.stringify(data, null, 2);

      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      console.log('Archivo JSON exportado:', result.uri);

      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Exportar datos',
          text: 'Compartir archivo JSON',
          url: result.uri,
          dialogTitle: 'Exportar datos'
        });
      } else {
        this.downloadFile(jsonData, filename, 'application/json');
      }
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      throw error;
    }
  }

  /**
   * Descarga un archivo en el navegador (solo web)
   */
  private downloadFile(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Lee un archivo desde el input de archivo (web)
   */
  async readFileFromInput(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(e);
      };
      reader.readAsText(file);
    });
  }

  /**
   * Valida el formato de un archivo CSV
   */
  validateCSV(csvData: string): { valid: boolean; error?: string } {
    if (!csvData || csvData.trim().length === 0) {
      return { valid: false, error: 'El archivo está vacío' };
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { valid: false, error: 'El archivo debe contener al menos una línea de encabezado y una de datos' };
    }

    const header = lines[0].split(';');
    if (header.length < 5) {
      return { valid: false, error: 'El formato del CSV no es válido. Debe contener al menos 5 columnas separadas por punto y coma' };
    }

    return { valid: true };
  }
}
