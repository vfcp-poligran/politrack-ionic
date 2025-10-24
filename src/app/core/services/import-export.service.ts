import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { CursoService } from './curso.service';
import { Curso, EvaluacionesCurso } from '../models';
import { AlertController, LoadingController, ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding, WriteFileResult } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface PoliTrackBackup {
  exportDate: string;
  version: number;
  cursos: { [key: string]: Omit<Curso, 'evaluaciones'> };
  evaluaciones: { [cursoId: string]: EvaluacionesCurso };
  comentariosComunes: string[];
  rubricas: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {
  private databaseService = inject(DatabaseService);
  private cursoService = inject(CursoService);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);

  private readonly BACKUP_VERSION = 1.0;

  constructor() { }

  private async gatherDataForExport(): Promise<PoliTrackBackup> {
    const cursosObj = await this.databaseService.getCursos();
    const evaluaciones: { [cursoId: string]: EvaluacionesCurso } = {};

    for (const cursoId in cursosObj) {
      evaluaciones[cursoId] = await this.databaseService.getEvaluacionesCurso(cursoId);
      delete (cursosObj[cursoId] as any).evaluaciones;
    }

    const comentariosComunes = await this.databaseService.getComentariosComunes();
    const rubricas = await this.databaseService.getRubricas();

    return {
      exportDate: new Date().toISOString(),
      version: this.BACKUP_VERSION,
      cursos: cursosObj,
      evaluaciones: evaluaciones,
      comentariosComunes: comentariosComunes,
      rubricas: rubricas,
    };
  }

  async exportarDatos(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Generando copia de seguridad...',
    });
    await loading.present();

    try {
      const backupData = await this.gatherDataForExport();
      const jsonData = JSON.stringify(backupData, null, 2);
      const fileName = `politrack_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        const result: WriteFileResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonData,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        await loading.dismiss();

        await Share.share({
          title: 'Copia de PoliTrack',
          text: `Copia de seguridad generada el ${new Date().toLocaleDateString()}`,
          url: result.uri,
        });

      } else {
        await loading.dismiss();

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      await this.showToast('Datos exportados correctamente.', 'success');

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al exportar datos:', error);
      await this.showAlert('Error de Exportación', `No se pudo generar el archivo: ${error.message || 'Error desconocido'}`);
    }
  }

  async importarDatos(): Promise<void> {
    const confirm = await this.confirmImport();
    if (!confirm) return;

    let fileContent: string | undefined;
    try {
      fileContent = await this.pickFileWeb();
      if (!fileContent) {
        await this.showToast('No se seleccionó ningún archivo.', 'warning');
        return;
      }
    } catch (error: any) {
      console.error('Error seleccionando archivo:', error);
      await this.showAlert('Error de Importación', `No se pudo leer el archivo: ${error.message || 'Error desconocido'}`);
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Restaurando datos...',
    });
    await loading.present();

    try {
      const backupData: PoliTrackBackup = JSON.parse(fileContent);

      if (!backupData.version || !backupData.cursos || !backupData.evaluaciones) {
        throw new Error('El archivo no parece ser una copia de seguridad válida de PoliTrack.');
      }

      await this.databaseService.clearDatabase();

      for (const cursoId in backupData.cursos) {
        const curso = backupData.cursos[cursoId];
        await this.databaseService.saveCurso(curso.id, curso);
      }

      for (const cursoId in backupData.evaluaciones) {
        const entregas = backupData.evaluaciones[cursoId];
        for (const entrega in entregas) {
          const evalsPorEntrega = (entregas as any)[entrega];
          if (evalsPorEntrega) {
            for (const estudianteId in evalsPorEntrega) {
              const evaluacion = evalsPorEntrega[estudianteId];
              await this.databaseService.saveFullEvaluacionEstudiante(
                cursoId,
                estudianteId,
                entrega as 'E1' | 'E2' | 'EF',
                evaluacion
              );
            }
          }
        }
      }

      if (backupData.comentariosComunes) {
        await this.databaseService.saveComentariosComunes(backupData.comentariosComunes);
      }

      if (backupData.rubricas) {
        for (const rubricaId in backupData.rubricas) {
          await this.databaseService.saveRubrica(rubricaId, backupData.rubricas[rubricaId]);
        }
      }

      await loading.dismiss();
      await this.cursoService.loadCursos();
      await this.showAlert('Importación Completa', 'Los datos se han restaurado correctamente.');

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al restaurar datos:', error);
      await this.showAlert('Error de Restauración', `El archivo está dañado o tiene un formato incorrecto: ${error.message}`);
    }
  }

  private async confirmImport(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Confirmar Importación',
        message: '¡ADVERTENCIA! Esto borrará TODOS los datos actuales y los reemplazará con los del archivo. ¿Desea continuar?',
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: 'Importar', role: 'destructive', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  private pickFileWeb(): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = () => {
            reject(new Error('No se pudo leer el archivo.'));
          };
          reader.readAsText(file);
        } else {
          resolve(undefined);
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showToast(message: string, color: string = 'success', duration = 2500) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Lee el contenido de un archivo desde un input de tipo file
   */
  async readFileFromInput(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('No se pudo leer el archivo.'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Valida el formato de un CSV
   */
  validateCSV(csvData: string): { valid: boolean; error?: string } {
    try {
      const lines = csvData.split('\n').filter(line => line.trim() !== '');

      if (lines.length < 2) {
        return { valid: false, error: 'El archivo CSV debe contener al menos un encabezado y una fila de datos' };
      }

      const header = lines[0].toLowerCase();
      const requiredFields = ['apellidos', 'nombres', 'correo', 'subgrupo'];

      for (const field of requiredFields) {
        if (!header.includes(field)) {
          return { valid: false, error: `El encabezado debe contener el campo: ${field}` };
        }
      }

      // Validar que cada línea tenga el número correcto de columnas
      const headerColumns = lines[0].split(',').length;
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').length;
        if (columns !== headerColumns) {
          return { valid: false, error: `La fila ${i + 1} tiene un número incorrecto de columnas` };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: `Error al validar CSV: ${error.message}` };
    }
  }

  /**
   * Exporta datos a un archivo CSV
   */
  async exportToCSV(csvContent: string, filename: string): Promise<void> {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error al exportar CSV:', error);
      throw new Error(`No se pudo exportar el archivo: ${error.message}`);
    }
  }
}
