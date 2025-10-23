import { Component, OnInit, OnDestroy, inject } from '@angular/core'; // Importar OnDestroy
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
  IonSpinner, AlertController, ActionSheetController, ActionSheetButton, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, download, settings, trash, createOutline, ellipsisVertical, schoolOutline } from 'ionicons/icons';
import { Subject } from 'rxjs'; // Importar Subject
import { takeUntil } from 'rxjs/operators'; // Importar takeUntil

import { CursoService } from '../core/services/curso.service';
import { ImportExportService } from '../core/services/import-export.service';
import { Curso } from '../core/models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
    IonSpinner
  ],
  standalone: true // Added standalone flag
})
export class HomePage implements OnInit, OnDestroy { // Implementar OnDestroy
  private router = inject(Router);
  private cursoService = inject(CursoService);
  private importExportService = inject(ImportExportService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private toastController = inject(ToastController);

  cursos: Curso[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>(); // Subject para gestionar desuscripción

  constructor() {
    addIcons({ add, download, settings, trash, createOutline, ellipsisVertical, schoolOutline });
  }

  async ngOnInit() {
    await this.loadCursos();
  }

  async ionViewWillEnter() {
     // Recargar cursos cada vez que la vista entra para reflejar cambios
     // (como eliminaciones hechas en otra página)
    await this.loadCursos();
  }

  ngOnDestroy() {
    this.destroy$.next(); // Emitir señal
    this.destroy$.complete(); // Completar el Subject
    console.log('HomePage destroyed, subscription cleaned up.'); // Log cleanup
  }

  /**
   * Carga la lista de cursos
   */
  async loadCursos(): Promise<void> {
    this.isLoading = true;
    // Cancel any previous subscription before starting a new one in case ionViewWillEnter calls this multiple times
    this.destroy$.next();

    try {
      await this.cursoService.loadCursos(); // Carga inicial o recarga desde DB/Storage
      this.cursoService.cursos$
        .pipe(takeUntil(this.destroy$)) // Desuscribirse cuando destroy$ emita o se llame de nuevo
        .subscribe(cursosObj => {
          this.cursos = Object.values(cursosObj);
          // Only set isLoading to false once data is processed
          this.isLoading = false;
          console.log('Cursos loaded/updated:', this.cursos.length);
        });
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      this.isLoading = false; // Asegurarse de quitar el loading en caso de error
      await this.showAlert('Error', 'No se pudieron cargar los cursos.');
    }
  }

  /**
   * Selecciona un curso y navega a su detalle
   */
  selectCurso(curso: Curso): void {
    if (!curso || !curso.id) {
        console.error("Attempted to select an invalid curso:", curso);
        this.showAlert('Error', 'No se pudo seleccionar el curso.');
        return;
    }
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
    input.accept = '.csv, text/csv'; // Be more specific with accept attribute

    input.onchange = async (event: any) => {
      console.log('Archivo seleccionado, procesando...');
      const file = event.target.files?.[0]; // Use optional chaining

      if (file) {
        console.log('Archivo encontrado:', file.name, 'Tamaño:', file.size);
        this.isLoading = true; // Show loading indicator during processing

        try {
          console.log('Leyendo contenido del archivo...');
          const csvData = await this.importExportService.readFileFromInput(file);
          console.log('Archivo leído, validando...');

          const validation = this.importExportService.validateCSV(csvData);
          console.log('Resultado validación:', validation);

          if (!validation.valid) {
            await this.showAlert('Error', validation.error || 'CSV inválido');
            this.isLoading = false; // Hide loading on error
            return;
          }

          console.log('CSV válido, solicitando nombre del curso...');
          // Hide loading indicator before showing the prompt
          this.isLoading = false;
          await this.promptNombreCurso(csvData);
        } catch (error: any) { // Catch specific error type if possible
          console.error('Error al importar CSV:', error);
          await this.showAlert('Error', `No se pudo importar el archivo: ${error?.message || error}`);
          this.isLoading = false; // Hide loading on error
        }
      } else {
        console.log('No se seleccionó ningún archivo');
        // Optionally, hide loading indicator if it was shown previously
        // this.isLoading = false;
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
          handler: async (data: { nombre?: string }) => { // Type the data
            const nombreTrimmed = data.nombre?.trim();
            if (nombreTrimmed) {
              this.isLoading = true; // Show loading while creating
              await this.crearCursoDesdeCSV(csvData, nombreTrimmed);
              this.isLoading = false; // Hide loading after creation attempt
            } else {
                 // Prevent closing if name is empty and show toast/message
                 await this.showToast('El nombre del curso no puede estar vacío.', 'danger');
                 return false; // Prevents alert from dismissing
            }
          }
        }
      ],
      backdropDismiss: false // Prevent dismissing by clicking outside
    });

    await alert.present();
  }

  /**
   * Crea un curso desde datos CSV
   */
  private async crearCursoDesdeCSV(csvData: string, nombreCurso: string): Promise<void> {
    try {
      console.log('Creando curso:', nombreCurso);
      // console.log('Datos CSV (primeras 500 chars):', csvData.substring(0, 500)); // Log might be too large

      const cursoId = await this.cursoService.createCursoFromCSV(csvData, nombreCurso);
      console.log('Curso creado con ID:', cursoId);

      await this.showAlert('Éxito', `Curso "${nombreCurso}" creado exitosamente`);
      // loadCursos is handled by ionViewWillEnter or the subscription already active
      // await this.loadCursos(); // Avoid calling loadCursos here if ionViewWillEnter does it
    } catch (error: any) {
      console.error('Error al crear curso:', error);
      console.error('Stack trace:', error.stack);
      await this.showAlert('Error', `No se pudo crear el curso: ${error.message || error}`);
    } finally {
        // Ensure isLoading is false even if creation fails but wasn't caught above
        this.isLoading = false;
    }
  }

  /**
   * Muestra opciones para un curso
   */
  async mostrarOpcionesCurso(curso: Curso, event: Event): Promise<void> {
    event.stopPropagation(); // Prevent row click

    const actionSheet = await this.actionSheetController.create({
      header: curso.nombre,
      buttons: [
        {
          text: 'Abrir',
          icon: 'create-outline', // Use a more appropriate icon like 'open-outline' or 'eye-outline'?
          handler: () => {
            this.selectCurso(curso);
          }
        },
        {
          text: 'Exportar CSV',
          icon: 'download-outline', // Consistent icon name
          handler: async () => {
            await this.exportarCurso(curso);
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline', // Consistent icon name
          role: 'destructive',
          handler: async () => {
            await this.confirmarEliminarCurso(curso);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline', // Consistent icon name
          role: 'cancel'
        }
      ] as ActionSheetButton[] // Type assertion
    });

    await actionSheet.present();
  }

  /**
   * Exporta un curso a CSV
   */
  private async exportarCurso(curso: Curso): Promise<void> {
    try {
      this.isLoading = true; // Show loading
      const csv = await this.cursoService.exportCursoToCSV(curso.id);
      const filename = `${curso.nombre.replace(/[\s/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`; // Sanitize filename and add date
      await this.importExportService.exportToCSV(csv, filename);
       // Show toast instead of alert for success
      await this.showToast('Curso exportado correctamente', 'success');
    } catch (error: any) {
      console.error('Error al exportar curso:', error);
      await this.showAlert('Error', `No se pudo exportar el curso: ${error?.message || error}`);
    } finally {
        this.isLoading = false; // Hide loading
    }
  }

  /**
   * Confirma la eliminación de un curso
   */
  private async confirmarEliminarCurso(curso: Curso): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el curso "<strong>${curso.nombre}</strong>"? Esta acción no se puede deshacer.`, // Use strong tag
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive', // Use role for styling
          cssClass: 'alert-button-danger', // Optional: Custom class for more styling
          handler: async () => {
            this.isLoading = true; // Show loading during deletion
            await this.eliminarCurso(curso);
            this.isLoading = false; // Hide loading after deletion attempt
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
      await this.showToast('Curso eliminado correctamente', 'success');
      // No need to call loadCursos if the subscription handles updates,
      // or if ionViewWillEnter handles reload. Check CursoService behavior.
      // If cursoService.deleteCurso updates the BehaviorSubject, the view updates automatically.
    } catch (error: any) {
      console.error('Error al eliminar curso:', error);
      await this.showAlert('Error', `No se pudo eliminar el curso: ${error?.message || error}`);
    } finally {
        // Ensure isLoading is false even if deletion fails but wasn't caught above
        this.isLoading = false;
    }
  }

  /**
   * Navega a la página de configuración
   */
  goToSettings(): void {
    this.router.navigate(['/settings']); // Assuming '/settings' is the correct route
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

   /**
   * Muestra un toast de confirmación/error
   */
  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500, // Slightly longer duration
      position: 'top',
      color: color,
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

} // Fin de la clase HomePage

