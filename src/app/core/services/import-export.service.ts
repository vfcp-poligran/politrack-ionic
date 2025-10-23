import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { CursoService } from './curso.service';
import { Curso, EvaluacionesCurso } from '../models';
import { AlertController, LoadingController, Platform, ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding, WriteFileResult } from '@capacitor/filesystem';
import { Share, ShareOptions } from '@capacitor/share';
import { FilePicker, PickFilesResult } from '@capacitor/file-picker';

// Define la estructura del archivo de backup
interface PoliTrackBackup {
  exportDate: string;
  version: number;
  cursos: { [key: string]: Omit<Curso, 'evaluaciones'> }; // Guardar solo la base del curso (estudiantes, etc.)
  evaluaciones: { [cursoId: string]: EvaluacionesCurso }; // Guardar evaluaciones por separado
  comentariosComunes: string[];
  rubricas: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {

  private databaseService = inject(DatabaseService);
  private cursoService = inject(CursoService);
  private platform = inject(Platform);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private toastController = inject(ToastController);

  private readonly BACKUP_VERSION = 1.0;
  private readonly WEB_FILENAME = `politrack_backup_${new Date().toISOString().split('T')[0]}.json`;

  constructor() { }

  /**
   * Recopila todos los datos de la base de datos y los prepara para exportar.
   */
  private async gatherDataForExport(): Promise<PoliTrackBackup> {
    const cursosObj = await this.databaseService.getCursos();
    const evaluaciones: { [cursoId: string]: EvaluacionesCurso } = {};

    // Recopilar evaluaciones para cada curso
    for (const cursoId in cursosObj) {
      evaluaciones[cursoId] = await this.databaseService.getEvaluacionesCurso(cursoId);
      // Limpiar el objeto curso para no duplicar datos (opcional, pero buena práctica)
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

  /**
   * Exporta todos los datos de la aplicación a un archivo JSON.
   */
  async exportarDatos(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Generando copia de seguridad...',
    });
    await loading.present();

    try {
      const backupData = await this.gatherDataForExport();
      const jsonData = JSON.stringify(backupData, null, 2); // Formateado para legibilidad
      const fileName = `politrack_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        // --- Lógica Nativa (iOS/Android) ---
        // Guardar en directorio de Documentos
        const result: WriteFileResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonData,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        await loading.dismiss();

        // Usar Share para compartir/guardar el archivo
        await Share.share({
          title: 'Copia de PoliTrack',
          text: `Copia de seguridad generada el ${new Date().toLocaleDateString()}`,
          url: result.uri, // URI del archivo guardado
        });

      } else {
        // --- Lógica Web ---
        await loading.dismiss();

        // Crear un Blob y un link de descarga
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

  /**
   * Importa datos desde un archivo JSON, borrando los datos actuales.
   */
  async importarDatos(): Promise<void> {
    // 1. Confirmar con el usuario
    const confirm = await this.confirmImport();
    if (!confirm) return; // Usuario canceló

    // 2. Obtener el archivo
    let fileContent: string | undefined;
    try {
      if (Capacitor.isNativePlatform()) {
        // --- Lógica Nativa (iOS/Android) ---
        const result: PickFilesResult = await FilePicker.pickFiles({
          readData: true, // Leer el contenido del archivo
          types: ['application/json'],
        });
        if (result.files.length > 0) {
          fileContent = result.files[0].data; // Contenido en base64
          if (fileContent) {
            // Decodificar Base64 a string
            fileContent = atob(fileContent);
          }
        }
      } else {
        // --- Lógica Web ---
        fileContent = await this.pickFileWeb();
      }

      if (!fileContent) {
        await this.showToast('No se seleccionó ningún archivo.', 'warning');
        return;
      }
    } catch (error: any) {
      console.error('Error seleccionando archivo:', error);
      await this.showAlert('Error de Importación', `No se pudo leer el archivo: ${error.message || 'Error desconocido'}`);
      return;
    }

    // 3. Procesar y restaurar
    const loading = await this.loadingController.create({
      message: 'Restaurando datos...',
    });
    await loading.present();

    try {
      const backupData: PoliTrackBackup = JSON.parse(fileContent);

      // Validar backup (básico)
      if (!backupData.version || !backupData.cursos || !backupData.evaluaciones) {
        throw new Error('El archivo no parece ser una copia de seguridad válida de PoliTrack.');
      }

      // --- INICIO DE RESTAURACIÓN ---
      // 4. Limpiar base de datos actual
      await this.databaseService.clearDatabase();

      // 5. Restaurar Cursos
      for (const cursoId in backupData.cursos) {
        const curso = backupData.cursos[cursoId];
        await this.databaseService.saveCurso(curso.id, curso);
      }

      // 6. Restaurar Evaluaciones
      for (const cursoId in backupData.evaluaciones) {
        const entregas = backupData.evaluaciones[cursoId];
        for (const entrega in entregas) {
          const evalsPorEntrega = (entregas as any)[entrega];
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

      // 7. Restaurar Comentarios Comunes
      if (backupData.comentariosComunes) {
        await this.databaseService.saveComentariosComunes(backupData.comentariosComunes);
      }

      // 8. Restaurar Rúbricas
      if (backupData.rubricas) {
        for (const rubricaId in backupData.rubricas) {
          await this.databaseService.saveRubrica(rubricaId, backupData.rubricas[rubricaId]);
        }
      }
      // --- FIN DE RESTAURACIÓN ---

      await loading.dismiss();

      // 9. Recargar cursos en la UI
      await this.cursoService.loadCursos();
      await this.showAlert('Importación Completa', 'Los datos se han restaurado correctamente.');

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al restaurar datos:', error);
      await this.showAlert('Error de Restauración', `El archivo está dañado o tiene un formato incorrecto: ${error.message}`);
    }
  }

  /**
   * Helper para mostrar un prompt de confirmación de importación.
   */
  private async confirmImport(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Confirmar Importación',
        message: '<strong>¡ADVERTENCIA!</strong> Esto borrará <strong>TODOS</strong> los datos actuales y los reemplazará con los del archivo. ¿Desea continuar?',
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: 'Importar', role: 'destructive', handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  /**
   * Helper para seleccionar un archivo JSON en la web.
   */
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
          reader.onerror = (e) => {
            reject(new Error('No se pudo leer el archivo.'));
          };
          reader.readAsText(file);
        } else {
          resolve(undefined); // No se seleccionó archivo
        }
      };
      // Simular click
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }

  // --- Helpers de UI ---
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
}
