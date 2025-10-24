import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
  IonSpinner, AlertController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, download, settings, trash, createOutline, ellipsisVertical, schoolOutline } from 'ionicons/icons';

import { CursoService } from '../core/services/curso.service';
import { ImportExportService } from '../core/services/import-export.service';
import { Curso } from '../core/models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
    IonSpinner
  ],
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private cursoService = inject(CursoService);
  private importExportService = inject(ImportExportService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  cursos: Curso[] = [];
  isLoading = true;

  constructor() {
    addIcons({ add, download, settings, trash, createOutline, ellipsisVertical, schoolOutline });
  }

  async ngOnInit() {
    await this.loadCursos();
  }

  async ionViewWillEnter() {
    await this.loadCursos();
  }

  /**
   * Carga la lista de cursos
   */
  async loadCursos(): Promise<void> {
    this.isLoading = true;
    try {
      this.cursoService.getCursos().subscribe((cursosObj: Record<string, Curso>) => {
        this.cursos = Object.values(cursosObj);
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      this.isLoading = false;
    }
  }

  /**
   * Selecciona un curso y navega a su detalle
   */
  selectCurso(curso: Curso): void {
    this.cursoService.setCursoActivo(curso.id);
    this.router.navigate(['/curso-detail', curso.id]);
  }

  /**
   * Muestra el diálogo para importar un curso desde CSV
   */
  async importarCSV(): Promise<void> {
    console.log('importarCSV() llamado');

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event: any) => {
      console.log('Archivo seleccionado, procesando...');
      const file = event.target.files[0];

      if (file) {
        console.log('Archivo encontrado:', file.name, 'Tamaño:', file.size);

        try {
          console.log('Leyendo contenido del archivo...');
          const csvData = await this.importExportService.readFileFromInput(file);
          console.log('Archivo leído, validando...');

          const validation = this.importExportService.validateCSV(csvData);
          console.log('Resultado validación:', validation);

          if (!validation.valid) {
            await this.showAlert('Error', validation.error || 'CSV inválido');
            return;
          }

          console.log('CSV válido, solicitando nombre del curso...');
          await this.promptNombreCurso(csvData);
        } catch (error) {
          console.error('Error al importar CSV:', error);
          await this.showAlert('Error', `No se pudo importar el archivo: ${error}`);
        }
      } else {
        console.log('No se seleccionó ningún archivo');
      }
    };

    console.log('Abriendo selector de archivos...');
    input.click();
  }

  /**
   * Solicita el nombre del curso
   */
  private async promptNombreCurso(csvData: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nuevo Curso',
      message: 'Ingrese el nombre del curso',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre del curso'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async (data) => {
            if (data.nombre && data.nombre.trim()) {
              await this.crearCursoDesdeCSV(csvData, data.nombre.trim());
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Crea un curso desde datos CSV
   */
  private async crearCursoDesdeCSV(csvData: string, nombreCurso: string): Promise<void> {
    try {
      console.log('Creando curso:', nombreCurso);
      console.log('Datos CSV (primeras 500 chars):', csvData.substring(0, 500));

      const cursoId = await this.cursoService.createCursoFromCSV(csvData, nombreCurso);
      console.log('Curso creado con ID:', cursoId);

      await this.showAlert('Éxito', `Curso "${nombreCurso}" creado exitosamente`);
      await this.loadCursos();
    } catch (error: any) {
      console.error('Error al crear curso:', error);
      console.error('Stack trace:', error.stack);
      await this.showAlert('Error', `No se pudo crear el curso: ${error.message || error}`);
    }
  }

  /**
   * Muestra opciones para un curso
   */
  async mostrarOpcionesCurso(curso: Curso, event: Event): Promise<void> {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: curso.nombre,
      buttons: [
        {
          text: 'Abrir',
          icon: 'create-outline',
          handler: () => {
            this.selectCurso(curso);
          }
        },
        {
          text: 'Exportar CSV',
          icon: 'download',
          handler: async () => {
            await this.exportarCurso(curso);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash',
          role: 'destructive',
          handler: async () => {
            await this.confirmarEliminarCurso(curso);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Exporta un curso a CSV
   */
  private async exportarCurso(curso: Curso): Promise<void> {
    try {
      const csv = await this.cursoService.exportCursoToCSV(curso.id);
      const filename = `${curso.nombre.replace(/\s+/g, '_')}_${Date.now()}.csv`;
      await this.importExportService.exportToCSV(csv, filename);
      await this.showAlert('Éxito', 'Curso exportado correctamente');
    } catch (error) {
      console.error('Error al exportar curso:', error);
      await this.showAlert('Error', 'No se pudo exportar el curso');
    }
  }

  /**
   * Confirma la eliminación de un curso
   */
  private async confirmarEliminarCurso(curso: Curso): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el curso "${curso.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.eliminarCurso(curso);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Elimina un curso
   */
  private async eliminarCurso(curso: Curso): Promise<void> {
    try {
      await this.cursoService.deleteCurso(curso.id);
      await this.showAlert('Éxito', 'Curso eliminado correctamente');
      await this.loadCursos();
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      await this.showAlert('Error', 'No se pudo eliminar el curso');
    }
  }

  /**
   * Navega a la página de configuración
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Muestra un alert con un mensaje
   */
  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
