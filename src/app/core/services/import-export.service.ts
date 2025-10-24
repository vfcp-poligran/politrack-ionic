import { APP_CONSTANTS } from '../constants/app.constants';

export class HistoryService {
  private readonly MAX_HISTORY = APP_CONSTANTS.HISTORY.MAX_HISTORY;
  private historyBuffer: any[] = [];

  pushState(state: any) {
    if (this.historyBuffer.length > this.MAX_HISTORY) {
      this.historyBuffer.shift();
    }
    this.historyBuffer.push(state);
  }
}

// import-export.service.ts
export class ImportExportService {
  private readonly BACKUP_VERSION = APP_CONSTANTS.BACKUP.VERSION;

  private async gatherDataForExport() {
    return {
      version: this.BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      // ...
    };
  }

  /**
   * Lee el contenido de un archivo File como texto.
   * @param file Archivo a leer
   * @returns Promise<string> con el contenido del archivo
   */
  async readFileFromInput(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Valida el contenido de un archivo CSV.
   * @param csvData El contenido del archivo CSV como string.
   * @returns Un objeto con la propiedad 'valid' (boolean) y opcionalmente 'error' (string).
   */
  validateCSV(csvData: string): { valid: boolean; error?: string } {
    if (!csvData || typeof csvData !== 'string') {
      return { valid: false, error: 'El archivo CSV está vacío o es inválido.' };
    }
    // Ejemplo simple: verifica que tenga al menos una línea y una coma
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { valid: false, error: 'El archivo CSV debe tener al menos una fila de datos.' };
    }
    if (!lines[0].includes(',')) {
      return { valid: false, error: 'El archivo CSV no tiene el formato correcto.' };
    }
    return { valid: true };
  }

  /**
   * Exporta datos CSV como archivo descargable
   */
  exportToCSV(csvData: string, filename: string): void {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
