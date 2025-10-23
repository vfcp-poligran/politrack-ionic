import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonFab, IonFabButton, IonSpinner, IonRefresher, IonRefresherContent, IonSearchbar, IonItemSliding, IonItemOptions, IonItemOption, IonButton, AlertController, ActionSheetController, ToastController // <-- Importar dependencias de UI
, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, chevronForwardOutline, trashOutline, createOutline, ellipsisVertical, cloudUploadOutline, cloudDownloadOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { Curso, Estudiante } from '../core/models';
import { CursoService } from '../core/services/curso.service';
// Importar ImportExportService (el que está en el Canvas)
import { ImportExportService } from '../core/services/import-export.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonIcon, IonFab, IonFabButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonSearchbar, IonItemSliding, IonItemOptions,
    IonItemOption, IonButton,
    IonButtons
],
})
export class HomePage implements OnInit {

  // Inyectar servicios correctos
  private cursoService = inject(CursoService);
  private importExportService = inject(ImportExportService); // <-- Usar este
  private router = inject(Router);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private toastController = inject(ToastController);

  // Usar el Observable del servicio para reactividad automática
  public cursos$: Observable<Curso[]>;
  public isLoading = false;

  // Para el filtro/búsqueda
  public cursosFiltrados: Curso[] = [];
  private cursosOriginales: Curso[] = []; // Almacén local para filtrar

  constructor() {
    // 1. Añadir iconos
    addIcons({
      addOutline, chevronForwardOutline, trashOutline, createOutline,
      ellipsisVertical, cloudUploadOutline, cloudDownloadOutline
    });

    // 2. Suscribirse al Observable de cursos (del servicio correcto)
    this.cursos$ = this.cursoService.cursos$;
  }

  ngOnInit() {
    // Suscribirse a los cambios para mantener la lista de filtrado
    this.cursos$.subscribe(cursos => {
      this.cursosOriginales = cursos;
      this.cursosFiltrados = cursos; // Inicializar lista filtrada
    });
  }

  /**
   * Cargar cursos cada vez que la vista esté a punto de entrar.
   * Esto asegura que los datos estén frescos si volvemos del detalle.
   */
  async ionViewWillEnter() {
    await this.loadCursos(true); // Cargar en silencio la primera vez
  }

  /**
   * Carga o recarga la lista de cursos desde el servicio.
   * Usa async/await, no .subscribe()
   */
  async loadCursos(enSilencio = false) {
    if (!enSilencio) {
      this.isLoading = true;
    }
    try {
      // 3. Llamar al método asíncrono del servicio
      await this.cursoService.loadCursos();
      // La suscripción en ngOnInit actualizará cursosOriginales y cursosFiltrados
    } catch (error) {
      console.error('Error al cargar cursos en HomePage:', error);
      await this.showAlert('Error', 'No se pudieron cargar los cursos.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Abre un curso específico.
   */
  openCurso(cursoId: string) {
    this.router.navigate(['/curso', cursoId]);
  }

  /**
   * Muestra un prompt para agregar un nuevo curso.
   * (Esta es la lógica de edición en línea que refactorizamos)
   */
  async presentAddCursoPrompt() {
    const alert = await this.alertController.create({
      header: 'Nuevo Curso',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre del curso (ej. App Móvil G1)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            if (data.nombre && data.nombre.trim().length > 0) {
              await this.addCurso(data.nombre.trim());
            } else {
              await this.showToast('Debe ingresar un nombre.', 'warning');
              return false; // Evita que se cierre el alert
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Llama al servicio para agregar un nuevo curso.
   */
  private async addCurso(nombre: string) {
    this.isLoading = true;
    try {
      // 4. Llamar al servicio (asumiendo que inicia sin estudiantes)
      const nuevoCurso = await this.cursoService.addCurso(nombre, []);
      await this.showToast(`Curso "${nuevoCurso.nombre}" creado.`);
      // La UI se actualiza automáticamente gracias al Observable
    } catch (error) {
      console.error('Error al crear curso:', error);
      await this.showAlert('Error', 'No se pudo crear el curso.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Muestra un prompt para editar el nombre de un curso.
   * (Lógica de edición en línea)
   */
  async presentEditCursoPrompt(curso: Curso) {
    const alert = await this.alertController.create({
      header: 'Editar Curso',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          value: curso.nombre, // Cargar nombre actual
          placeholder: 'Nombre del curso'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.nombre && data.nombre.trim().length > 0) {
              curso.nombre = data.nombre.trim();
              await this.cursoService.updateCurso(curso.id, { nombre: curso.nombre });
              await this.showToast('Curso actualizado.');
            } else {
              await this.showToast('Debe ingresar un nombre.', 'warning');
              return false; // Evita que se cierre el alert
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Muestra un prompt de confirmación para eliminar un curso.
   */
  async confirmDeleteCurso(curso: Curso) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar el curso "${curso.nombre}"? Se borrarán todas sus evaluaciones. Esta acción es irreversible.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.deleteCurso(curso.id);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Llama al servicio para eliminar un curso.
   * Usa async/await
   */
  private async deleteCurso(cursoId: string) {
    this.isLoading = true;
    try {
      // 5. Llamar al servicio asíncrono
      await this.cursoService.deleteCurso(cursoId);
      await this.showToast('Curso eliminado correctamente.');
      // La UI se actualiza automáticamente
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      await this.showAlert('Error', 'No se pudo eliminar el curso.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Maneja el evento del Refresher (tirar para actualizar).
   * Lógica async/await robusta.
   */
  async handleRefresh(event: any) {
    try {
      await this.cursoService.loadCursos();
    } catch (error) {
      console.error('Error en refresh:', error);
      await this.showAlert('Error', 'No se pudieron recargar los cursos.');
    } finally {
      // Completar la animación del refresher
      if (event && event.target) {
        event.target.complete();
      }
    }
  }

  /**
   * Filtra la lista de cursos según el texto de búsqueda.
   */
  handleSearch(event: Event) {
    const searchTerm = (event.target as HTMLIonSearchbarElement).value?.toLowerCase() || '';
    if (!searchTerm) {
      this.cursosFiltrados = this.cursosOriginales;
      return;
    }

    this.cursosFiltrados = this.cursosOriginales.filter(curso =>
      curso.nombre.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Abre el menú de opciones (Importar/Exportar).
   * (Esta es la lógica de importación/exportación correcta)
   */
  async openMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Importar Datos (JSON)',
          icon: 'cloudUploadOutline',
          handler: () => {
            this.importarDatos(); // <-- Llama al método de abajo
          }
        },
        {
          text: 'Exportar Datos (JSON)',
          icon: 'cloudDownloadOutline',
          handler: () => {
            this.exportarDatos(); // <-- Llama al método de abajo
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Llama al servicio de importación (el del Canvas)
   */
  async importarDatos() {
    try {
      // 6. Llama al servicio correcto
      await this.importExportService.importarDatos();
      // No es necesario un alert de éxito aquí, el servicio ya muestra uno.
      // Los datos se recargarán automáticamente.
    } catch (error: any) {
      // El servicio ya maneja sus propios errores, pero podemos poner un log
      console.error('Error capturado en HomePage al importar:', error);
      await this.showAlert('Error de Importación', `Ocurrió un error: ${error.message}`);
    }
  }

  /**
   * Llama al servicio de exportación (el del Canvas)
   */
  async exportarDatos() {
    try {
      // 7. Llama al servicio correcto
      await this.importExportService.exportarDatos();
    } catch (error: any) {
      console.error('Error capturado en HomePage al exportar:', error);
      await this.showAlert('Error de Exportación', `Ocurrió un error: ${error.message}`);
    }
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

  private async showToast(message: string, color: string = 'success', duration = 2000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Función de seguimiento para *ngFor
  trackCursoById(index: number, curso: Curso) {
    return curso.id;
  }
}

