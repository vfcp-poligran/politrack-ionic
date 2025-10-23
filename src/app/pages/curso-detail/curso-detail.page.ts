import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonSegment, IonSegmentButton,
  IonLabel, IonSpinner, IonCheckbox,
  AlertController, ModalController, ToastController, ActionSheetController,
  IonTextarea, IonInput, IonChip // Añadidos para ComentariosModalComponent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack, filterOutline, downloadOutline, addOutline, searchOutline,
  analyticsOutline, close, checkmarkCircleOutline, warningOutline, alertCircleOutline,
  documentTextOutline, locateOutline, listOutline, gitNetworkOutline, phonePortraitOutline,
  helpOutline, megaphoneOutline, flag, createOutline, trashOutline, closeOutline, chatboxOutline, chatbox,
  buildOutline, refreshOutline, laptopOutline, codeWorkingOutline, videocamOutline, // Añadidos para getCriterioIcon
  checkmarkDoneOutline, constructOutline, colorPaletteOutline, peopleOutline, timerOutline, terminalOutline // Añadidos para getCriterioIcon
} from 'ionicons/icons';
import { ActionSheetButton } from '@ionic/core';

import { CursoService } from '../../core/services/curso.service';
import { DatabaseService } from '../../core/services/database.service';
// Importar todos los modelos necesarios
import { Curso, Estudiante, Criterio, Nivel, EvaluacionesCurso, Evaluacion, EvaluacionDetalle } from '../../core/models';
import { ComentariosModalComponent } from './comentarios-modal.component';

// Interfaces para datos de modales y estado interno
interface PuntosEditadosData {
  pg_score?: string | number;
  pi_score?: string | number;
}

interface ComentariosModalData {
    comentarios: string;
    ajustePuntaje: number;
    guardarComoComun: boolean;
}

interface EvaluacionIndividualState {
    estudiante: Estudiante | null;
    entrega: 'E1' | 'E2' | 'EF';
    criterios: { [criterioCodigo: string]: number }; // Código_criterio -> puntaje final
    comentariosCriterios: { [criterioCodigo: string]: string };
    ajustesPuntaje: { [criterioCodigo: string]: number };
    comentarios: string; // Comentario general
    fecha: string; // ISO String date
    esGrupal: boolean; // Siempre false aquí
}

interface EvaluacionGrupalState {
    subgrupo: string;
    entrega: 'E1' | 'E2' | 'EF';
    criterios: { [criterioCodigo: string]: number }; // Código_criterio -> puntaje final
    comentariosCriterios: { [criterioCodigo: string]: string };
    ajustesPuntaje: { [criterioCodigo: string]: number };
    comentarios: string; // Comentario general
    fecha: string; // ISO String date
}


// --- Definición de Rúbricas ---
const RUBRICAS_GRUPALES: { [key in 'E1' | 'E2' | 'EF']: any[] } = { // Tipado más específico
    'E1': [
      { codigo: 'documento_inicial', nombre: 'Documento Inicial', peso: '(5)', maxPuntos: 5, niveles: [ { valor: 1, nombre: 'Insuficiente', descripcion: 'Sin formato o incompleto.' }, { valor: 3, nombre: 'Aceptable', descripcion: 'Formato básico adecuado.' }, { valor: 5, nombre: 'Excelente', descripcion: 'Formato profesional y portada completa.' } ] },
      { codigo: 'planteamiento_objetivos', nombre: 'Planteamiento y Objetivos', peso: '(5)', maxPuntos: 5, niveles: [ { valor: 1, nombre: 'Insuficiente', descripcion: 'Objetivos vagos o incompletos.' }, { valor: 3, nombre: 'Aceptable', descripcion: 'Objetivos claros con algunos detalles.' }, { valor: 5, nombre: 'Excelente', descripcion: 'Objetivos SMART.' } ] },
      { codigo: 'requerimientos', nombre: 'Requerimientos', peso: '(10)', maxPuntos: 10, niveles: [ { valor: 4, nombre: 'Insuficiente', descripcion: 'Lista incompleta o confusa.' }, { valor: 7, nombre: 'Aceptable', descripcion: 'Identifica la mayoría.' }, { valor: 10, nombre: 'Excelente', descripcion: 'Identifica exhaustivamente todos.' } ] },
      { codigo: 'flujo_navegacion', nombre: 'Flujo de Navegación', peso: '(30)', maxPuntos: 30, niveles: [ { valor: 9, nombre: 'Insuficiente', descripcion: 'Confuso o incompleto.' }, { valor: 20, nombre: 'Aceptable', descripcion: 'Flujo funcional y comprensible.' }, { valor: 30, nombre: 'Excelente', descripcion: 'Flujo completo, claro y detallado.' } ] },
      { codigo: 'mockups_wireframes', nombre: 'Mockups y Wireframes', peso: '(25)', maxPuntos: 25, niveles: [ { valor: 7, nombre: 'Insuficiente', descripcion: 'Básicos o de baja calidad.' }, { valor: 17, nombre: 'Aceptable', descripcion: 'Mockups funcionales.' }, { valor: 25, nombre: 'Excelente', descripcion: 'Mockups completos y profesionales.' } ] }
    ],
    'E2': [
      { codigo: 'atencion_ajustes_tutor', nombre: 'Atención de ajustes del tutor', peso: '(5)', maxPuntos: 5, niveles: [ { valor: 1, nombre: 'Insuficiente', descripcion: 'Menos del 70% de comentarios atendidos, ajustes superficiales o incompletos.' }, { valor: 3, nombre: 'Aceptable', descripcion: 'Se atendió el 70-90% de los comentarios con algunos detalles pendientes.' }, { valor: 5, nombre: 'Excelente', descripcion: 'Todos los comentarios se atendieron de manera completa y pertinente.' } ] },
      { codigo: 'flujo_navegacion_mockups', nombre: 'Flujo de navegación y mockups', peso: '(10)', maxPuntos: 10, niveles: [ { valor: 4, nombre: 'Insuficiente', descripcion: 'Flujo confuso, incompleto o sin lógica clara.' }, { valor: 7, nombre: 'Aceptable', descripcion: 'Flujo comprensible con inconsistencias menores.' }, { valor: 10, nombre: 'Excelente', descripcion: 'Flujo completo, lógico e intuitivo con mockups bien diseñados.' } ] },
      { codigo: 'requerimientos_actualizados', nombre: 'Requerimientos actualizados', peso: '(10)', maxPuntos: 10, niveles: [ { valor: 4, nombre: 'Insuficiente', descripcion: 'Incompletos, desactualizados o mal redactados.' }, { valor: 7, nombre: 'Aceptable', descripcion: 'Presentes y actualizados, pero con falta de claridad o detalle.' }, { valor: 10, nombre: 'Excelente', descripcion: 'Completos, bien redactados, actualizados y coherentes.' } ] },
      { codigo: 'implementacion_interfaces', nombre: 'Implementación de interfaces (70%)', peso: '(20)', maxPuntos: 20, niveles: [ { valor: 9, nombre: 'Insuficiente', descripcion: 'Menos del 60% de interfaces, errores significativos.' }, { valor: 15, nombre: 'Aceptable', descripcion: '60-89% de interfaces, errores menores.' }, { valor: 20, nombre: 'Excelente', descripcion: '90-100% de interfaces, navegación correcta.' } ] },
      { codigo: 'desarrollo_requerimientos', nombre: 'Desarrollo de requerimientos', peso: '(30)', maxPuntos: 30, niveles: [ { valor: 14, nombre: 'Insuficiente', descripcion: 'Menos del 50% implementado, errores significativos.' }, { valor: 23, nombre: 'Aceptable', descripcion: '50-79% implementado, lógica con errores menores.' }, { valor: 30, nombre: 'Excelente', descripcion: '80-100% implementado, lógica correcta y buenas prácticas.' } ] }
    ],
    'EF': [
      { codigo: 'video', nombre: 'Video', peso: '(10)', maxPuntos: 10, niveles: [ { valor: 4, nombre: 'Insuficiente', descripcion: 'El video no es claro, no muestra toda la funcionalidad o tiene mala calidad.' }, { valor: 7, nombre: 'Aceptable', descripcion: 'El video es claro, pero no cubre toda la funcionalidad o tiene detalles de calidad.' }, { valor: 10, nombre: 'Excelente', descripcion: 'Video claro, conciso, que demuestra toda la funcionalidad principal.' } ] },
      { codigo: 'cumplimiento_requerimientos', nombre: 'Cumplimiento de Requerimientos', peso: '(65)', maxPuntos: 65, niveles: [ { valor: 16, nombre: 'Insuficiente', descripcion: 'Menos del 70% de los requerimientos funcionales implementados.' }, { valor: 41, nombre: 'Aceptable', descripcion: 'Entre el 70% y 90% de los requerimientos funcionales implementados.' }, { valor: 65, nombre: 'Excelente', descripcion: 'Más del 90% de los requerimientos funcionales implementados.' } ] },
      { codigo: 'calidad_codigo_arquitectura', nombre: 'Calidad del Código y Arquitectura', peso: '(15)', maxPuntos: 15, niveles: [ { valor: 5, nombre: 'Insuficiente', descripcion: 'El código es desorganizado, difícil de leer o no sigue patrones de arquitectura.' }, { valor: 10, nombre: 'Aceptable', descripcion: 'El código es legible y sigue principios básicos de arquitectura, pero tiene áreas de mejora.' }, { valor: 15, nombre: 'Excelente', descripcion: 'Código limpio, bien documentado y sigue patrones de arquitectura MVC/MVVM.' } ] },
      { codigo: 'arte_final_experiencia_usuario', nombre: 'Arte Final y Experiencia de Usuario', peso: '(10)', maxPuntos: 10, niveles: [ { valor: 4, nombre: 'Insuficiente', descripcion: 'La interfaz es poco atractiva, inconsistente o difícil de usar.' }, { valor: 7, nombre: 'Aceptable', descripcion: 'La interfaz es funcional y consistente, pero visualmente simple.' }, { valor: 10, nombre: 'Excelente', descripcion: 'Interfaz atractiva, consistente y ofrece una excelente experiencia de usuario.' } ] }
    ]
};

const RUBRICA_INDIVIDUAL = [
    { codigo: 'participacion_colaboracion', nombre: 'Participación y Colaboración', peso: '(20)', maxPuntos: 20, niveles: [ { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'Participación mínima o nula. No muestra interés ni aporta.' }, { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Participa ocasionalmente con aportes limitados.' }, { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Participación activa y constante. Lidera iniciativas.' } ] },
    { codigo: 'responsabilidad_cumplimiento', nombre: 'Responsabilidad y Cumplimiento', peso: '(20)', maxPuntos: 20, niveles: [ { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'No cumple con responsabilidades asignadas.' }, { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Cumple parcialmente, algunas tareas quedan pendientes.' }, { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Cumple puntualmente con todas las tareas asignadas.' } ] },
    { codigo: 'comunicacion_presentacion', nombre: 'Comunicación y Presentación', peso: '(20)', maxPuntos: 20, niveles: [ { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'Comunicación deficiente o poco clara.' }, { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Comunicación básica pero efectiva.' }, { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Comunicación clara, efectiva y profesional.' } ] },
    { codigo: 'conocimiento_tecnico', nombre: 'Conocimiento Técnico', peso: '(15)', maxPuntos: 15, niveles: [ { valor: 4, nombre: 'Insuficiente (0-4)', descripcion: 'Conocimiento técnico insuficiente o nulo.' }, { valor: 10, nombre: 'Aceptable (5-10)', descripcion: 'Conocimiento técnico básico pero funcional.' }, { valor: 15, nombre: 'Excelente (11-15)', descripcion: 'Dominio técnico sólido y aplicado eficazmente.' } ] }
];
// --- Fin Definición de Rúbricas ---

@Component({
  selector: 'app-curso-detail',
  templateUrl: './curso-detail.page.html',
  styleUrls: ['./curso-detail.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonSearchbar, IonSegment, IonSegmentButton,
    IonLabel, IonSpinner, IonCheckbox
  ],
  standalone: true
})
export class CursoDetailPage implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private cursoService = inject(CursoService);
  private databaseService = inject(DatabaseService);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);

  cursoId: string = '';
  curso: Curso | null = null; // Curso contiene las evaluaciones cargadas
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  isLoading = true;

  searchText = '';
  subgrupoFilter = '';
  subgrupos: string[] = [];
  selectedEstudiantes: Set<string> = new Set();
  selectAll = false;
  entregas = ['E1', 'E2', 'EF'];
  entregaActiva: 'E1' | 'E2' | 'EF' = 'E1';
  showSeguimiento = false;
  subgrupoActual = ''; // Almacena el subgrupo activo para el panel
  subgrupoSeleccionado = ''; // Almacena el subgrupo seleccionado en el filtro/panel
  evaluacionGrupalActiva = false;
  mostrarResumen = false;

  evaluacionActual: EvaluacionIndividualState = this.resetEvaluacionIndividualState();
  evaluacionGrupal: EvaluacionGrupalState = this.resetEvaluacionGrupalState();

  comentariosComunes: string[] = [];
  puntosActualizados: Set<string> = new Set();

  constructor() {
    addIcons({
      arrowBack, filterOutline, downloadOutline, addOutline, searchOutline,
      analyticsOutline, close, checkmarkCircleOutline, warningOutline, alertCircleOutline,
      documentTextOutline, locateOutline, listOutline, gitNetworkOutline, phonePortraitOutline,
      helpOutline, megaphoneOutline, flag, createOutline, trashOutline, closeOutline, chatboxOutline, chatbox,
      buildOutline, refreshOutline, laptopOutline, codeWorkingOutline, videocamOutline,
      checkmarkDoneOutline, constructOutline, colorPaletteOutline, peopleOutline, timerOutline, terminalOutline
    });
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.cursoId) {
      // 1. Asegurarse que el DatabaseService esté listo
      // (Asumiendo que `cursoService.getCurso` o `databaseService.get...`
      // lo manejan internamente con `ensureInitialized`)

      // 2. Cargar datos
      await this.loadCurso(); // Carga curso y evaluaciones
      await this.cargarComentariosComunes();
    } else {
      console.error("No se proporcionó ID de curso.");
      this.isLoading = false;
      await this.showAlert('Error', 'ID de curso no válido.');
      this.goBack();
    }
  }

  /**
   * Carga los datos del curso y sus evaluaciones asociadas.
   */
  async loadCurso(): Promise<void> {
    this.isLoading = true;
    try {
      // Obtener datos básicos del curso (incluye lista de estudiantes)
      // Usamos cursoService que a su vez usa databaseService.getCurso
      const cursoBase = await this.cursoService.getCurso(this.cursoId);

      if (cursoBase) {
        // Cargar las evaluaciones para este curso usando databaseService
        const evaluaciones = await this.databaseService.getEvaluacionesCurso(this.cursoId);

        // Combinar datos base con evaluaciones
        this.curso = { ...cursoBase, evaluaciones };
        this.estudiantes = this.curso.estudiantes || [];
        this.extractSubgrupos();
        this.applyFilters(); // Aplicar filtros iniciales
      } else {
         console.warn(`Curso con ID ${this.cursoId} no encontrado.`);
         this.curso = null;
         this.estudiantes = [];
         this.subgrupos = [];
      }
    } catch (error) {
      console.error('Error al cargar curso y evaluaciones:', error);
      this.curso = null; // Asegurar estado limpio en caso de error
      this.estudiantes = [];
      this.subgrupos = [];
      await this.showAlert('Error', 'No se pudo cargar la información del curso.');
    } finally {
      this.isLoading = false;
    }
  }

  // --- MÉTODOS DE FILTRADO, SELECCIÓN Y NAVEGACIÓN ---

  private extractSubgrupos(): void {
    const subgruposSet = new Set<string>(this.estudiantes.map(e => e.subgrupo).filter(Boolean));
    this.subgrupos = Array.from(subgruposSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });
  }

  getSubgruposOrdenados(): string[] { return this.subgrupos; }

  applyFilters(): void {
    let filtered = [...this.estudiantes];
    const search = this.searchText.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(est =>
        est.apellidos.toLowerCase().includes(search) ||
        est.nombres.toLowerCase().includes(search) ||
        est.correo.toLowerCase().includes(search)
      );
    }
    if (this.subgrupoFilter) {
      filtered = filtered.filter(est => est.subgrupo === this.subgrupoFilter);
    }
    this.estudiantesFiltrados = filtered;
    this.updateSelectAllState();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLIonSearchbarElement | null;
    this.searchText = target?.value?.toLowerCase() || '';
    this.applyFilters();
  }

  onSubgrupoChange(event: CustomEvent): void {
    this.subgrupoFilter = event.detail.value || '';
    this.applyFilters();
  }

  selectSubgrupo(subgrupo: string): void {
    this.subgrupoFilter = subgrupo;
    this.applyFilters();
  }

  toggleSelectAll(event: CustomEvent): void {
    const checked = event.detail.checked;
    this.selectAll = checked;
    this.selectedEstudiantes = checked
      ? new Set(this.estudiantesFiltrados.map(est => est.correo))
      : new Set();
  }

  toggleSelectEstudiante(correo: string): void {
    if (this.selectedEstudiantes.has(correo)) {
      this.selectedEstudiantes.delete(correo);
    } else {
      this.selectedEstudiantes.add(correo);
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    const numFiltered = this.estudiantesFiltrados.length;
    this.selectAll = numFiltered > 0 && this.estudiantesFiltrados.every(est => this.selectedEstudiantes.has(est.correo));
  }

  isSelected(correo: string): boolean { return this.selectedEstudiantes.has(correo); }
  isPuntosActualizados(correo: string): boolean { return this.puntosActualizados.has(correo); }

  goBack(): void { this.router.navigate(['/home']); }
  toggleSeguimiento(): void { this.showSeguimiento = !this.showSeguimiento; }

  // --- MÉTODOS DE EVALUACIÓN ---

  /**
   * Obtiene la evaluación (objeto completo) de un estudiante para una entrega.
   */
  getEvaluacion(correo: string, entrega: 'E1' | 'E2' | 'EF'): Evaluacion | null {
    if (!this.curso || !this.curso.evaluaciones) return null;
    return this.curso.evaluaciones[entrega]?.[correo] || null;
  }

  /**
   * Inicia la evaluación individual para un estudiante seleccionado.
   */
  async iniciarEvaluacion(estudiante: Estudiante): Promise<void> {
    console.log('Iniciando evaluación individual para:', estudiante.correo);
    this.evaluacionGrupalActiva = false; // Desactivar grupal
    this.subgrupoSeleccionado = '';    // Limpiar filtro de grupo del panel
    this.mostrarResumen = false;         // Ocultar resumen grupal

    this.evaluacionActual = {
      ...this.resetEvaluacionIndividualState(),
      estudiante: estudiante,
      entrega: this.entregaActiva,
    };

    await this.cargarEvaluacionExistente(estudiante, this.entregaActiva);
  }

  /**
   * Activa la evaluación grupal para un subgrupo seleccionado.
   */
  async activarRubricaGrupal(subgrupo: string): Promise<void> {
    this.evaluacionGrupalActiva = true;
    this.evaluacionActual.estudiante = null; // Desactivar individual
    this.mostrarResumen = false;           // Ocultar resumen al cambiar

    this.evaluacionGrupal = {
      ...this.resetEvaluacionGrupalState(),
      subgrupo: subgrupo,
      entrega: this.entregaActiva,
    };

    await this.cargarEvaluacionGrupalExistente(subgrupo, this.entregaActiva);
    console.log(`Rúbrica grupal activada para ${subgrupo} en ${this.entregaActiva}`);
  }

  /**
   * Selecciona un subgrupo desde el panel, activando la rúbrica grupal.
   */
  async seleccionarSubgrupo(subgrupo: string): Promise<void> {
    this.subgrupoSeleccionado = subgrupo;

    if (subgrupo === '') { // Si selecciona "Todos"
      this.evaluacionGrupalActiva = false;
      this.evaluacionActual.estudiante = null; // También deseleccionar estudiante
      this.mostrarResumen = false;
    } else {
      await this.activarRubricaGrupal(subgrupo);
    }

    // Actualizar filtro de tabla
    this.subgrupoFilter = subgrupo;
    this.applyFilters();
  }

  /**
   * Maneja el cambio de la pestaña de entrega.
   */
  async onEntregaChange(event: CustomEvent): Promise<void> {
    this.entregaActiva = event.detail.value as 'E1' | 'E2' | 'EF';
    this.mostrarResumen = false; // Ocultar resumen al cambiar entrega

    if (this.evaluacionGrupalActiva && this.subgrupoSeleccionado) {
      // Recargar evaluación GRUPAL para la nueva entrega
      await this.activarRubricaGrupal(this.subgrupoSeleccionado);
    } else if (this.evaluacionActual.estudiante) {
      // Recargar evaluación INDIVIDUAL para la nueva entrega
      await this.iniciarEvaluacion(this.evaluacionActual.estudiante);
    }
    // Si no hay evaluación activa, no hacer nada más
  }

   /**
   * Cancela la evaluación en curso (limpia estado temporal).
   */
  cancelarEvaluacion(): void {
    if (this.evaluacionGrupalActiva && this.evaluacionGrupal.subgrupo) {
        const subgrupo = this.evaluacionGrupal.subgrupo;
        this.evaluacionGrupal = {
            ...this.resetEvaluacionGrupalState(),
            subgrupo: subgrupo, // Mantener subgrupo
            entrega: this.entregaActiva // Mantener entrega
        };
        // Recargar datos existentes si los había
        this.cargarEvaluacionGrupalExistente(subgrupo, this.entregaActiva);
        this.mostrarResumen = false;
        this.showToast('Cambios de evaluación grupal descartados');
    } else if (this.evaluacionActual.estudiante) {
        const est = this.evaluacionActual.estudiante; // Guardar referencia
        this.evaluacionActual = {
           ...this.resetEvaluacionIndividualState(),
           estudiante: est, // Mantener estudiante
           entrega: this.entregaActiva // Mantener entrega
        };
        // Recargar datos existentes si los había
        this.cargarEvaluacionExistente(est, this.entregaActiva);
        this.showToast('Cambios de evaluación individual descartados');
    }
  }

  /**
   * Carga los datos de una evaluación individual existente en el estado `evaluacionActual`.
   */
  private async cargarEvaluacionExistente(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
      const evaluacionExistente = this.getEvaluacion(estudiante.correo, entrega);

      // Resetear estado antes de cargar
      this.evaluacionActual.criterios = {};
      this.evaluacionActual.comentariosCriterios = {};
      this.evaluacionActual.ajustesPuntaje = {};
      this.evaluacionActual.comentarios = '';

      if (evaluacionExistente?.ind_eval) {
          const indEval = evaluacionExistente.ind_eval;
          // Cargar puntajes finales
          indEval.criterios?.forEach((criterioGuardado: Criterio) => {
              const criterioDef = this.getCriteriosEntregaActiva().find(c => c.nombre === criterioGuardado.nombre || c.codigo === (criterioGuardado as any).codigo);
              if (criterioDef) {
                  this.evaluacionActual.criterios[criterioDef.codigo] = criterioGuardado.points ?? 0;
              }
          });
          // Cargar comentarios y ajustes
          this.evaluacionActual.comentariosCriterios = (indEval as any).comentariosCriterios || {};
          this.evaluacionActual.ajustesPuntaje = (indEval as any).ajustesPuntaje || {};
          this.evaluacionActual.comentarios = indEval.comentarios || '';
          this.evaluacionActual.fecha = indEval.fecha || new Date().toISOString();
          console.log(`Evaluación individual cargada para ${estudiante.correo} - ${entrega}`);
      } else {
           console.log(`No hay datos de evaluación individual para ${estudiante.correo} - ${entrega}`);
      }
      this.actualizarPuntuacionTotal(); // Recalcular total después de cargar
  }

  /**
   * Carga los datos de una evaluación grupal existente en el estado `evaluacionGrupal`.
   */
  private async cargarEvaluacionGrupalExistente(subgrupo: string, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);
    if (estudiantesGrupo.length === 0) return;

    // Buscar una evaluación grupal representativa (de cualquier estudiante del grupo)
    let grupEvalDetalle: EvaluacionDetalle | undefined;
    for (const est of estudiantesGrupo) {
        const evalEst = this.getEvaluacion(est.correo, entrega);
        if (evalEst?.grup_eval) {
            grupEvalDetalle = evalEst.grup_eval;
            break; // Encontrado, usar este
        }
    }

    // Resetear estado antes de cargar
    this.evaluacionGrupal.criterios = {};
    this.evaluacionGrupal.comentariosCriterios = {};
    this.evaluacionGrupal.ajustesPuntaje = {};
    this.evaluacionGrupal.comentarios = '';

    if (grupEvalDetalle) {
        grupEvalDetalle.criterios?.forEach((criterioGuardado: Criterio) => {
             const criterioDef = this.getCriteriosEntregaActiva().find(c => c.nombre === criterioGuardado.nombre || c.codigo === (criterioGuardado as any).codigo);
             if (criterioDef) {
                 this.evaluacionGrupal.criterios[criterioDef.codigo] = criterioGuardado.points ?? 0;
             }
        });
        this.evaluacionGrupal.comentariosCriterios = (grupEvalDetalle as any).comentariosCriterios || {};
        this.evaluacionGrupal.ajustesPuntaje = (grupEvalDetalle as any).ajustesPuntaje || {};
        this.evaluacionGrupal.comentarios = typeof grupEvalDetalle.comentarios === 'string' ? grupEvalDetalle.comentarios : '';
        this.evaluacionGrupal.fecha = grupEvalDetalle.fecha || new Date().toISOString();
        console.log(`Evaluación grupal cargada para ${subgrupo} - ${entrega}`);
    } else {
         console.log(`No hay datos de evaluación grupal para ${subgrupo} - ${entrega}`);
    }
    this.actualizarPuntuacionTotal(); // Recalcular total
  }


  /**
   * Construye el objeto EvaluacionDetalle a partir del estado actual (indiv o grupal).
   */
  private construirEvaluacionDetalle(isGrupal: boolean): EvaluacionDetalle {
      const targetState = isGrupal ? this.evaluacionGrupal : this.evaluacionActual;
      const criteriosActivos = this.getCriteriosEntregaActiva();
      const totalScore = this.calcularTotalEvaluacion();

      const criteriosArray: Criterio[] = criteriosActivos.map((criterioDef: any) => {
          const codigo = criterioDef.codigo;
          const valorSeleccionado = targetState.criterios[codigo]; // Puntaje final (con ajuste)
          const ajuste = targetState.ajustesPuntaje[codigo] || 0;
          const valorBase = (valorSeleccionado !== undefined && valorSeleccionado !== null) ? valorSeleccionado - ajuste : undefined; // Calcular base

          // Encontrar el nivel correspondiente al valor BASE
          const nivelSeleccionado = criterioDef.niveles.find((n: any) => n.valor === valorBase);

          return {
              codigo: criterioDef.codigo, // Guardar código para mejor mapeo futuro
              nombre: criterioDef.nombre,
              descripcion: criterioDef.peso, // O descripción real si la tienes
              selectedLevel: nivelSeleccionado?.valor, // Nivel base seleccionado
              points: valorSeleccionado ?? 0, // Puntaje FINAL
              niveles: criterioDef.niveles.map((nivel: any) => ({
                  nivel: nivel.valor,
                  descripcion: nivel.descripcion,
                  puntos: nivel.valor
              }))
          };
      });

      // Asegurar que la fecha sea la actual si se está modificando
      targetState.fecha = new Date().toISOString();

      return {
          criterios: criteriosArray,
          totalScore: totalScore,
          comentarios: targetState.comentarios, // Comentario general
          fecha: targetState.fecha,
          // Incluir comentarios y ajustes específicos de criterios
          comentariosCriterios: targetState.comentariosCriterios,
          ajustesPuntaje: targetState.ajustesPuntaje
      };
  }

  /**
   * Guarda la evaluación individual actual usando DatabaseService.saveFullEvaluacionEstudiante.
   */
  private async guardarEvaluacionActual(): Promise<void> {
    if (!this.evaluacionActual.estudiante || !this.curso) return;

    const estudianteId = this.evaluacionActual.estudiante.correo;
    const entrega = this.evaluacionActual.entrega;
    const evaluacionExistente = this.getEvaluacion(estudianteId, entrega) || { correo: estudianteId };
    const indEvalDetalle = this.construirEvaluacionDetalle(false);
    const piScore = indEvalDetalle.totalScore;
    const pgScore = evaluacionExistente.pg_score; // Mantener PG existente
    const sumatoria = piScore + (pgScore ?? 0);

    const evaluacionCompleta: Evaluacion = {
        ...evaluacionExistente, // Mantener grup_eval si existe
        correo: estudianteId,
        pi_score: piScore,
        pg_score: pgScore,
        sumatoria: sumatoria,
        ind_eval: indEvalDetalle, // Guardar detalles individuales
        updatedAt: new Date().toISOString() // Marcar actualización
    };

    try {
        await this.databaseService.saveFullEvaluacionEstudiante(this.cursoId, estudianteId, entrega, evaluacionCompleta);
        // Actualizar el objeto curso local para reflejar el cambio inmediato en la UI
        if (this.curso?.evaluaciones?.[entrega]) {
            this.curso.evaluaciones[entrega]![estudianteId] = evaluacionCompleta;
        }
        console.log(`Evaluación individual guardada para ${estudianteId} - ${entrega}`);
    } catch (error) {
        console.error('Error guardando evaluación individual:', error);
        this.showAlert('Error', 'No se pudo guardar la evaluación individual.');
        throw error;
    }
  }

  /**
   * Guarda la evaluación grupal actual usando DatabaseService.saveFullEvaluacionEstudiante para cada miembro.
   */
  private async guardarEvaluacionGrupal(): Promise<void> {
      if (!this.evaluacionGrupal.subgrupo || !this.curso) return;

      const subgrupo = this.evaluacionGrupal.subgrupo;
      const entrega = this.evaluacionGrupal.entrega;
      const grupEvalDetalle = this.construirEvaluacionDetalle(true);
      const pgScore = grupEvalDetalle.totalScore;

      const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);

      try {
          for (const estudiante of estudiantesGrupo) {
              const estudianteId = estudiante.correo;
              const evaluacionExistente = this.getEvaluacion(estudianteId, entrega) || { correo: estudianteId };
              const piScore = evaluacionExistente.pi_score; // Mantener PI existente
              const sumatoria = pgScore + (piScore ?? 0);

              const evaluacionCompleta: Evaluacion = {
                  ...evaluacionExistente, // Mantener ind_eval si existe
                  correo: estudianteId,
                  pg_score: pgScore,
                  pi_score: piScore,
                  sumatoria: sumatoria,
                  grup_eval: grupEvalDetalle, // Guardar detalles grupales
                  updatedAt: new Date().toISOString() // Marcar actualización
              };

              await this.databaseService.saveFullEvaluacionEstudiante(this.cursoId, estudianteId, entrega, evaluacionCompleta);
              // Actualizar el objeto curso local
              if (this.curso?.evaluaciones?.[entrega]) {
                  this.curso.evaluaciones[entrega]![estudianteId] = evaluacionCompleta;
              }
          }
          this.mostrarResumen = true; // Mostrar resumen después de guardar
          console.log(`Evaluación grupal guardada para ${subgrupo} - ${entrega}`);
      } catch (error) {
          console.error('Error guardando evaluación grupal:', error);
          this.showAlert('Error', 'No se pudo guardar la evaluación grupal.');
          throw error;
      }
  }

  /**
   * Valida si hay una evaluación activa (individual o grupal) para operar.
   */
  private validarEvaluacionActiva(isGrupal: boolean, targetEval: EvaluacionIndividualState | EvaluacionGrupalState): boolean {
     if (isGrupal && !(targetEval as EvaluacionGrupalState).subgrupo) {
      this.showAlert('Error', 'Debe seleccionar un subgrupo para evaluar grupalmente.');
      return false;
    }
    if (!isGrupal && !(targetEval as EvaluacionIndividualState).estudiante) {
      this.showAlert('Error', 'Debe seleccionar un estudiante para evaluar individualmente.');
      return false;
    }
    return true;
  }

  /**
   * Guarda la evaluación actual (individual o grupal) en la base de datos.
   */
  private async guardarEvaluacion(isGrupal: boolean): Promise<void> {
     if (isGrupal) {
        await this.guardarEvaluacionGrupal();
     } else {
        await this.guardarEvaluacionActual();
     }
  }

  /**
   * Selecciona o deselecciona un nivel para un criterio (individual o grupal).
   * Guarda automáticamente el cambio.
   */
  async selectNivel(criterioCodigo: string, valor: number): Promise<void> {
    const isGrupal = this.evaluacionGrupalActiva;
    const targetEval = isGrupal ? this.evaluacionGrupal : this.evaluacionActual;

    if (!this.validarEvaluacionActiva(isGrupal, targetEval)) {
        return; // Salir si no hay evaluación activa válida
    }

    // Toggle: deseleccionar si se hace clic en el mismo valor
    const valorActual = targetEval.criterios[criterioCodigo];
    const valorFinal = valorActual === valor ? 0 : valor;

    if (valorFinal === 0) {
        targetEval.criterios[criterioCodigo] = 0; // Guardar 0 explícitamente
    } else {
        targetEval.criterios[criterioCodigo] = valorFinal;
    }
    // Resetear ajuste si se cambia el nivel
    targetEval.ajustesPuntaje[criterioCodigo] = 0;


    try {
      await this.guardarEvaluacion(isGrupal);
      this.actualizarVistaEvaluaciones(); // Actualiza UI (tabla)
      this.actualizarPuntuacionTotal(); // Actualiza UI (panel)

      const targetName = isGrupal
        ? this.evaluacionGrupal.subgrupo
        : this.evaluacionActual.estudiante?.nombres ?? 'Estudiante';
      const tipoEval = isGrupal ? 'grupales' : 'individuales';

      this.showToast(`Puntos ${tipoEval} actualizados: ${targetName} - ${valorFinal} pts`);
      console.log(`Evaluando ${isGrupal ? 'grupo ' + targetName : targetName}: ${criterioCodigo} = ${valorFinal} puntos`);

    } catch (error: any) {
       console.error(`Error al guardar evaluación ${isGrupal ? 'grupal' : 'individual'}:`, error.message);
       this.showAlert('Error', `No se pudo guardar la evaluación ${isGrupal ? 'grupal' : 'individual'}`);
    }
  }


  // --- MÉTODOS DE CÁLCULO Y VISUALIZACIÓN (Sin cambios mayores) ---
  calcularTotalEvaluacion(): number {
    const targetState = this.evaluacionGrupalActiva ? this.evaluacionGrupal : this.evaluacionActual;
    return Object.values(targetState.criterios).reduce((sum, points) => sum + (points || 0), 0);
  }

  getMaximoPuntaje(): number {
    return this.getCriteriosEntregaActiva().reduce((sum, criterio) => sum + (criterio.maxPuntos || 0), 0);
  }

  // --- MÉTODOS DE COMENTARIOS ---
  async abrirComentarios(codigoCriterio: string, nombreCriterio: string): Promise<void> {
      const isGrupal = this.evaluacionGrupalActiva;
      const targetEval = isGrupal ? this.evaluacionGrupal : this.evaluacionActual;

      if (!this.validarEvaluacionActiva(isGrupal, targetEval)) return;

      const comentariosActuales = targetEval.comentariosCriterios[codigoCriterio] || '';
      const puntajeGuardado = targetEval.criterios[codigoCriterio] ?? 0; // Puntaje final (con ajuste)
      const ajusteActual = targetEval.ajustesPuntaje[codigoCriterio] || 0;
      const puntajeBaseDelNivel = puntajeGuardado - ajusteActual; // Recalcular base

      try {
        const modal = await this.modalController.create({
          component: ComentariosModalComponent,
          componentProps: {
            criterioNombre: nombreCriterio,
            comentarios: comentariosActuales,
            puntajeOriginal: puntajeBaseDelNivel, // Base calculado
            ajustePuntaje: ajusteActual,
            comentariosComunes: this.comentariosComunes // Ya cargados desde DB
          }
        });
        await modal.present();

        const { data, role } = await modal.onWillDismiss<ComentariosModalData | null>();
        if (role === 'confirm' && data) {
            // Guardar nuevo comentario común si aplica
            if (data.guardarComoComun && data.comentarios.trim()) {
                await this.guardarComentarioComun(data.comentarios.trim());
            }

            // Actualizar estado local
            targetEval.comentariosCriterios[codigoCriterio] = data.comentarios;
            const nuevoAjuste = Number(data.ajustePuntaje) || 0;
            targetEval.ajustesPuntaje[codigoCriterio] = nuevoAjuste;
            const puntajeFinal = Math.max(0, puntajeBaseDelNivel + nuevoAjuste);
            targetEval.criterios[codigoCriterio] = puntajeFinal;

            // Guardar la evaluación completa en DB
            await this.guardarEvaluacion(isGrupal);
            this.actualizarVistaEvaluaciones(); // Actualizar UI (tabla y panel)
            this.actualizarPuntuacionTotal(); // Actualizar puntaje total en el panel
            this.showToast('Comentario y ajuste guardados');
        }
      } catch (error: any) {
        console.error('Error en modal de comentarios:', error.message);
        this.showAlert('Error', 'No se pudo guardar el comentario/ajuste.');
      }
  }

  /**
   * Carga comentarios comunes desde DatabaseService
   */
  private async cargarComentariosComunes(): Promise<void> {
    try {
      this.comentariosComunes = await this.databaseService.getComentariosComunes();
    } catch (error) {
        console.error("Error al cargar comentarios comunes desde DB:", error);
        // El servicio ya debería proveer defaults, pero por si acaso
        this.comentariosComunes = [
            'Excelente trabajo, sigue así',
            'Buen desempeño, pero puede mejorar'
        ];
    }
  }

  /**
   * Guarda un comentario común para uso futuro usando DatabaseService
   */
  async guardarComentarioComun(comentario: string): Promise<void> {
    const comentarioTrimmed = comentario?.trim();
    if (comentarioTrimmed) {
        try {
            // El método addComentarioComun ya maneja la lógica de no duplicados
            await this.databaseService.addComentarioComun(comentarioTrimmed);
            // Recargar la lista local para reflejar el cambio
            await this.cargarComentariosComunes();
            this.showToast('Comentario común guardado');
        } catch (error: any) {
            console.error("Error al guardar comentario común en DB:", error.message);
            this.showAlert('Error', 'No se pudo guardar el comentario común.');
        }
    }
  }


  // --- MÉTODOS DE EDICIÓN INLINE Y ELIMINACIÓN ---

  async abrirEditorPuntos(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    const evaluacion = this.getEvaluacion(estudiante.correo, entrega);
    const alert = await this.alertController.create({
      header: `Editar ${entrega} - ${estudiante.nombres}`,
      inputs: [
        { name: 'pg_score', type: 'number', placeholder: 'PG', value: evaluacion?.pg_score ?? '', min: 0 },
        { name: 'pi_score', type: 'number', placeholder: 'PI', value: evaluacion?.pi_score ?? '', min: 0 }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: async (data: PuntosEditadosData) => {
            await this.guardarPuntosEditados(estudiante, entrega, data);
        }}
      ]
    });
    await alert.present();
  }

  private async guardarPuntosEditados(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF', data: PuntosEditadosData): Promise<void> {
    if (!this.curso) return;

    try {
        const pgScoreNum = Number(data.pg_score ?? 0);
        const piScoreNum = Number(data.pi_score ?? 0);
        const pgScore = !isNaN(pgScoreNum) ? pgScoreNum : 0;
        const piScore = !isNaN(piScoreNum) ? piScoreNum : 0;
        const sumatoria = pgScore + piScore;

        // Obtener evaluación existente o crear una nueva si no existe
        const evaluacionExistente = this.getEvaluacion(estudiante.correo, entrega) || { correo: estudiante.correo };

        const evaluacionCompleta: Evaluacion = {
            ...evaluacionExistente,
            correo: estudiante.correo,
            pg_score: pgScore,
            pi_score: piScore,
            sumatoria: sumatoria,
            updatedAt: new Date().toISOString()
            // Conservar ind_eval y grup_eval si existen
        };

        // Guardar usando el método centralizado del DatabaseService
        await this.databaseService.saveFullEvaluacionEstudiante(this.cursoId, estudiante.correo, entrega, evaluacionCompleta);

        // Actualizar el estado local del curso para reflejar el cambio en la UI
        if (this.curso?.evaluaciones?.[entrega]) {
            this.curso.evaluaciones[entrega]![estudiante.correo] = evaluacionCompleta;
        }

        this.marcarPuntosActualizados(estudiante.correo); // Efecto visual
        this.applyFilters(); // Refrescar vista
        await this.showToast(`Puntos de ${entrega} guardados`);

    } catch (error: any) {
        console.error('Error al guardar puntos editados:', error.message);
        await this.showAlert('Error', 'No se pudieron guardar los puntos.');
    }
  }


   /**
   * Marca un estudiante para el efecto visual de actualización.
   */
  private marcarPuntosActualizados(correo: string): void {
      this.puntosActualizados.add(correo);
      setTimeout(() => {
          this.puntosActualizados.delete(correo);
          // Forzar re-renderizado si es necesario
          this.estudiantesFiltrados = [...this.estudiantesFiltrados];
      }, 2000);
  }


  async confirmarEliminacion(estudiante: Estudiante): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Eliminar a ${estudiante.nombres} ${estudiante.apellidos}? Se borrarán también sus evaluaciones.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: async () => {
            await this.eliminarEstudiante(estudiante);
        }}
      ]
    });
    await alert.present();
  }

  /**
   * (CORREGIDO)
   * Elimina un estudiante del curso y sus evaluaciones asociadas.
   */
  private async eliminarEstudiante(estudiante: Estudiante): Promise<void> {
    if (!this.curso) return;
    this.isLoading = true;
    try {
        // 1. Eliminar del array local de estudiantes
        this.estudiantes = this.estudiantes.filter(e => e.correo !== estudiante.correo);

        // 2. Actualizar el curso en la DB (esto guardará la nueva lista de estudiantes)
        //    (Asumiendo que cursoService.updateCurso existe y llama a databaseService.saveCurso)
        await this.cursoService.updateCurso(this.cursoId, { estudiantes: this.estudiantes });

        // 3. (CORREGIDO) Eliminar las evaluaciones del estudiante usando el DatabaseService
        //    Esto funciona tanto para SQLite (DELETE FROM) como para Ionic Storage (modificar objeto)
        await this.databaseService.deleteEvaluacionesEstudiante(this.cursoId, estudiante.correo);

        // 4. Actualizar UI
        this.applyFilters(); // Refresca estudiantesFiltrados
        await this.showToast(`${estudiante.nombres} eliminado`);

        // 5. Limpiar evaluaciones del estudiante del estado local 'this.curso'
        if (this.curso.evaluaciones) {
            delete this.curso.evaluaciones.E1?.[estudiante.correo];
            delete this.curso.evaluaciones.E2?.[estudiante.correo];
            delete this.curso.evaluaciones.EF?.[estudiante.correo];
        }

    } catch (error: any) {
        console.error('Error al eliminar estudiante:', error.message);
        await this.showAlert('Error', 'No se pudo eliminar el estudiante.');
        // Revertir cambios locales recargando todo
        await this.loadCurso();
    } finally {
        this.isLoading = false;
    }
  }

  // --- Métodos Helper Privados ---
  private resetEvaluacionIndividualState(): EvaluacionIndividualState {
      return {
          estudiante: null, entrega: 'E1', criterios: {}, comentariosCriterios: {},
          ajustesPuntaje: {}, comentarios: '', fecha: new Date().toISOString(), esGrupal: false
      };
  }
  private resetEvaluacionGrupalState(): EvaluacionGrupalState {
      return {
          subgrupo: '', entrega: 'E1', criterios: {}, comentariosCriterios: {},
          ajustesPuntaje: {}, comentarios: '', fecha: new Date().toISOString()
      };
  }

  private getCriteriosEntregaActiva(): any[] {
    const esGrupal = this.evaluacionGrupalActiva;
    if (esGrupal) {
        return RUBRICAS_GRUPALES[this.entregaActiva] || [];
    } else {
        // Asumiendo que E1, E2, EF comparten la misma rúbrica individual
        // Si no es así, necesitas lógica para seleccionar la rúbrica individual correcta
        return RUBRICA_INDIVIDUAL || [];
    }
  }

  private actualizarPuntuacionTotal(): void {
      // Esta función podría actualizar un valor en la UI
      // que muestre el total de la evaluación activa.
      const total = this.calcularTotalEvaluacion();
      console.log("Puntaje total actualizado:", total);
      // (Actualizar variable de UI si existe)
  }

  private actualizarVistaEvaluaciones(): void {
      // Esta función refresca los puntajes en la tabla principal
      // Forzar re-detección de cambios puede ser necesario
      this.estudiantesFiltrados = [...this.estudiantesFiltrados];
  }

  private async showAlert(header: string, message: string): Promise<void> {
      const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
      await alert.present();
  }

  private async showToast(message: string, duration = 2000): Promise<void> {
      const toast = await this.toastController.create({ message, duration, position: 'bottom' });
      await toast.present();
  }

  // --- Otros Métodos (ej. getCriterioValue, getRangoNivel, etc.) ---

  /**
   * Obtiene el valor (puntaje) guardado para un criterio específico.
   */
  getCriterioValue(codigo: string): number | undefined {
    const targetState = this.evaluacionGrupalActiva ? this.evaluacionGrupal : this.evaluacionActual;
    return targetState.criterios[codigo];
  }

  /**
   * Verifica si un nivel específico está seleccionado para un criterio.
   */
  isNivelSelectedForCriterio(codigo: string, valorNivel: number): boolean {
    const targetState = this.evaluacionGrupalActiva ? this.evaluacionGrupal : this.evaluacionActual;
    const puntajeGuardado = targetState.criterios[codigo]; // Puntaje final (con ajuste)
    const ajuste = targetState.ajustesPuntaje[codigo] || 0;
    const puntajeBase = (puntajeGuardado !== undefined && puntajeGuardado !== null) ? puntajeGuardado - ajuste : undefined; // Calcular base

    return puntajeBase === valorNivel;
  }

  /**
   * Obtiene el rango de nivel (Insuficiente, Aceptable, Excelente) basado en el puntaje.
   */
  getRangoNivel(criterio: any, puntaje: number | undefined): string {
    if (puntaje === undefined || puntaje === null) return 'Sin evaluar';
    if (criterio.niveles.length === 0) return 'Sin niveles';

    // Ordenar niveles por valor
    const nivelesOrdenados = [...criterio.niveles].sort((a, b) => a.valor - b.valor);

    // Si el puntaje es 0 o menor que el primer nivel
    if (puntaje <= 0) return 'Insuficiente'; // O 'Sin evaluar' si 0 es válido
    if (puntaje < nivelesOrdenados[0].valor) return nivelesOrdenados[0].nombre; // Nivel más bajo

    // Encontrar el nivel correspondiente
    let nivelNombre = nivelesOrdenados[0].nombre; // Default al más bajo
    for (const nivel of nivelesOrdenados) {
        if (puntaje >= nivel.valor) {
            nivelNombre = nivel.nombre;
        } else {
            break; // Se pasó
        }
    }

    // Manejar ajustes que superan el máximo
    const maxPuntosNivel = nivelesOrdenados[nivelesOrdenados.length - 1].valor;
    if (puntaje > maxPuntosNivel) {
       return nivelesOrdenados[nivelesOrdenados.length - 1].nombre; // Nivel más alto
    }

    return nivelNombre;
  }

  // ... (Otros métodos de UI, iconos, colores, etc. que no dependen del servicio DB) ...
  getCriterioIcon(codigo: string): string {
    const map: { [key: string]: string } = {
      'documento_inicial': 'documentTextOutline',
      'planteamiento_objetivos': 'locateOutline',
      'requerimientos': 'listOutline',
      'flujo_navegacion': 'gitNetworkOutline',
      'mockups_wireframes': 'phonePortraitOutline',
      'atencion_ajustes_tutor': 'buildOutline',
      'flujo_navegacion_mockups': 'gitNetworkOutline',
      'requerimientos_actualizados': 'refreshOutline',
      'implementacion_interfaces': 'laptopOutline',
      'desarrollo_requerimientos': 'codeWorkingOutline',
      'video': 'videocamOutline',
      'cumplimiento_requerimientos': 'checkmarkDoneOutline',
      'calidad_codigo_arquitectura': 'constructOutline',
      'arte_final_experiencia_usuario': 'colorPaletteOutline',
      'participacion_colaboracion': 'peopleOutline',
      'responsabilidad_cumplimiento': 'timerOutline',
      'comunicacion_presentacion': 'megaphoneOutline',
      'conocimiento_tecnico': 'terminalOutline',
    };
    return map[codigo] || 'helpOutline';
  }

}

// Las interfaces Evaluacion y EvaluacionDetalle se importan desde '../../core/models'

