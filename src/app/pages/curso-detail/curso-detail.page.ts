import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonSegment, IonSegmentButton,
  IonLabel, IonSpinner, IonCheckbox,
  AlertController, ModalController, ToastController, ActionSheetController,
  IonTextarea, IonInput, IonChip // Añadidos para ComentariosModalComponent (si se usa en línea)
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack, filterOutline, downloadOutline, addOutline, searchOutline,
  analyticsOutline, close, checkmarkCircleOutline, warningOutline, alertCircleOutline,
  documentTextOutline, locateOutline, listOutline, gitNetworkOutline, phonePortraitOutline,
  helpOutline, megaphoneOutline, flag, createOutline, trashOutline, closeOutline, chatboxOutline, chatbox,
  buildOutline, refreshOutline, laptopOutline, codeWorkingOutline, videocamOutline, // Añadidos para getCriterioIcon
  checkmarkDoneOutline, constructOutline, colorPaletteOutline, peopleOutline, timerOutline, terminalOutline // Añadidos para getCriterioIcon
} from 'ionicons/icons'; // Added necessary icons
import { ActionSheetButton } from '@ionic/core'; // For ActionSheetController types

import { CursoService } from '../../core/services/curso.service';
import { DatabaseService } from '../../core/services/database.service';
// Importar todos los modelos necesarios
import { Curso, Estudiante, Evaluacion, EvaluacionDetalle, Criterio, Nivel } from '../../core/models';
import { ComentariosModalComponent } from './comentarios-modal.component'; // <--- Importación del Modal

// Interfaces para datos de modales y eventos
interface PuntosEditadosData {
  pg_score?: string | number;
  pi_score?: string | number;
}

interface ComentariosModalData {
    comentarios: string;
    ajustePuntaje: number;
    guardarComoComun: boolean;
}

// --- Definición de Rúbricas (movidas fuera de la clase) ---
const RUBRICAS_GRUPALES = {
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
    IonLabel, IonSpinner, IonCheckbox,
    ComentariosModalComponent // <--- AÑADIDO EL MODAL AQUÍ
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
  curso: Curso | null = null;
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  isLoading = true;

  // Filtros
  searchText = '';
  subgrupoFilter = '';
  subgrupos: string[] = [];

  // Selección
  selectedEstudiantes: Set<string> = new Set();
  selectAll = false;

  // Entregas
  entregas = ['E1', 'E2', 'EF'];
  entregaActiva: 'E1' | 'E2' | 'EF' = 'E1'; // Tipo explícito

  // Panel de seguimiento
  showSeguimiento = false;
  subgrupoActual = 'G1'; // Tipo explícito string
  subgrupoSeleccionado = ''; // Para controlar el subgrupo seleccionado // Tipo explícito string
  evaluacionGrupalActiva = false; // Para controlar si la rúbrica grupal está activa
  mostrarResumen = false; // Para mostrar el resumen después de guardar evaluación grupal

    // Estado de evaluación actual - Added type definitions
  evaluacionActual: {
    estudiante: Estudiante | null;
    entrega: 'E1' | 'E2' | 'EF'; // Use specific types
    criterios: { [criterioCodigo: string]: number };
    comentariosCriterios: { [criterioCodigo: string]: string };
    ajustesPuntaje: { [criterioCodigo: string]: number };
    comentarios: string;
    fecha: string; // ISO String date
    esGrupal: boolean;
  } = {
    estudiante: null,
    entrega: 'E1',
    criterios: {},
    comentariosCriterios: {},
    ajustesPuntaje: {},
    comentarios: '',
    fecha: new Date().toISOString(),
    esGrupal: false
  };

  // Estado de evaluación grupal independiente - Added type definitions
  evaluacionGrupal: {
    subgrupo: string;
    entrega: 'E1' | 'E2' | 'EF'; // Use specific types
    criterios: { [criterioCodigo: string]: number };
    comentariosCriterios: { [criterioCodigo: string]: string };
    ajustesPuntaje: { [criterioCodigo: string]: number };
    comentarios: string;
    fecha: string; // ISO String date
  } = {
    subgrupo: '',
    entrega: 'E1',
    criterios: {},
    comentariosCriterios: {},
    ajustesPuntaje: {},
    comentarios: '',
    fecha: new Date().toISOString()
  };

  // Comentarios comunes predefinidos
  comentariosComunes: string[] = [
    'Excelente trabajo, sigue así',
    'Buen desempeño, pero puede mejorar',
    'Necesita más participación en las actividades',
    'Cumplió con los objetivos planteados',
    'Faltó profundidad en el análisis',
    'Presenta avances significativos',
    'Requiere mayor compromiso con el equipo'
  ];

  // Estado para indicadores visuales
  puntosActualizados: Set<string> = new Set(); // Para marcar qué estudiantes fueron actualizados

  constructor() {
    addIcons({
      arrowBack, filterOutline, downloadOutline, addOutline, searchOutline,
      analyticsOutline, close, checkmarkCircleOutline, warningOutline, alertCircleOutline,
      documentTextOutline, locateOutline, listOutline, gitNetworkOutline, phonePortraitOutline,
      helpOutline, megaphoneOutline, flag, createOutline, trashOutline, closeOutline, chatboxOutline, chatbox,
      buildOutline, refreshOutline, laptopOutline, codeWorkingOutline, videocamOutline, // Añadidos
      checkmarkDoneOutline, constructOutline, colorPaletteOutline, peopleOutline, timerOutline, terminalOutline // Añadidos
    });
    // Cargar comentarios comunes
    this.cargarComentariosComunes();
  }

  async ngOnInit() {
    const cursoIdParam: string | null = this.route.snapshot.paramMap.get('id');
    this.cursoId = cursoIdParam || '';
    if (this.cursoId) {
        await this.loadCurso();
    } else {
        console.error("No se proporcionó ID de curso.");
        this.isLoading = false;
        await this.showAlert('Error', 'No se especificó un ID de curso.');
        this.goBack(); // Regresar si no hay ID
    }
  }

  /**
   * Carga el curso desde la base de datos
   */
  async loadCurso(): Promise<void> {
    this.isLoading = true;
    try {
      this.curso = await this.cursoService.getCurso(this.cursoId);

      if (this.curso) {
        this.estudiantes = this.curso.estudiantes || [];
        this.extractSubgrupos();
        // Cargar evaluaciones ANTES de aplicar filtros
        this.curso.evaluaciones = await this.databaseService.getEvaluacionesCurso(this.cursoId);
        this.applyFilters(); // Aplicar filtros después de tener todos los datos
      } else {
         console.warn(`Curso con ID ${this.cursoId} no encontrado.`);
         this.estudiantes = [];
         this.subgrupos = [];
         this.curso = null; // Asegurarse que curso es null
      }

      this.isLoading = false;
    } catch (error: any) {
      console.error('Error al cargar curso:', error);
      this.isLoading = false;
      await this.showAlert('Error', 'No se pudo cargar el curso');
    }
  }

    /**
   * Extrae los subgrupos únicos de los estudiantes
   */
  private extractSubgrupos(): void {
    const subgruposSet = new Set<string>();
    this.estudiantes.forEach(est => {
      if (est.subgrupo) {
        subgruposSet.add(est.subgrupo);
      }
    });
    // Convert to array and sort naturally (G1, G2, ..., G10)
    this.subgrupos = Array.from(subgruposSet).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10);
        const numB = parseInt(b.replace(/\D/g, ''), 10);
        return numA - numB;
    });
  }

  /**
   * Obtiene los subgrupos ordenados ascendentemente
   */
  getSubgruposOrdenados(): string[] {
     // Sorting is now done in extractSubgrupos
    return this.subgrupos;
  }

  /**
   * Aplica filtros de búsqueda y subgrupo
   */
  applyFilters(): void {
    let filtered = [...this.estudiantes];

    // Filtro por texto de búsqueda
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(est =>
        est.apellidos.toLowerCase().includes(search) ||
        est.nombres.toLowerCase().includes(search) ||
        est.correo.toLowerCase().includes(search)
      );
    }

    // Filtro por subgrupo
    if (this.subgrupoFilter) {
      filtered = filtered.filter(est => est.subgrupo === this.subgrupoFilter);
    }

    this.estudiantesFiltrados = filtered;
     // Recalculate selectAll state after filtering
    this.updateSelectAllState();
  }

  /**
   * Maneja cambio en búsqueda
   * Changed event type from 'any' to 'Event' (more specific)
   * or use CustomEvent if expecting Ionic event detail
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLIonSearchbarElement | null; // More specific type
    this.searchText = target?.value?.toLowerCase() || '';
    this.applyFilters();
  }

  /**
   * Maneja cambio en filtro de subgrupo
   * Changed event type from 'any' to CustomEvent for Ionic components
   */
  onSubgrupoChange(event: CustomEvent): void {
    this.subgrupoFilter = event.detail.value || '';
    this.applyFilters();
  }

  /**
   * Selecciona un subgrupo específico para filtro
   */
  selectSubgrupo(subgrupo: string): void {
    this.subgrupoFilter = subgrupo;
    this.applyFilters();
  }

  /**
   * Selecciona un subgrupo desde el panel de seguimiento (maneja filtro y análisis)
   */
  selectSubgrupoFromPanel(subgrupo: string): void {
    this.subgrupoFilter = subgrupo;
    this.subgrupoActual = subgrupo || 'G1'; // Si es "T" (todos), usar G1 como análisis por defecto
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.searchText = '';
    this.subgrupoFilter = '';
    this.applyFilters();
  }

  /**
   * Alterna selección de todos los estudiantes
   * Changed event type from 'any' to CustomEvent for Ionic components
   */
  toggleSelectAll(event: CustomEvent): void {
    const checked = event.detail.checked;
    this.selectAll = checked; // Update the state property

    if (checked) {
      this.estudiantesFiltrados.forEach(est => {
        this.selectedEstudiantes.add(est.correo);
      });
    } else {
      this.selectedEstudiantes.clear();
    }
  }

  /**
   * Alterna selección de un estudiante
   */
  toggleSelectEstudiante(correo: string): void {
    if (this.selectedEstudiantes.has(correo)) {
      this.selectedEstudiantes.delete(correo);
    } else {
      this.selectedEstudiantes.add(correo);
    }

    this.updateSelectAllState();
  }

  /**
   * Actualiza el estado del checkbox "Seleccionar todos"
   */
  private updateSelectAllState(): void {
    const numFiltered = this.estudiantesFiltrados.length;
    // const numSelected = this.selectedEstudiantes.size; // No se usa numSelected

    // Check if all *currently filtered* students are selected
    if (numFiltered > 0) {
        this.selectAll = this.estudiantesFiltrados.every(est => this.selectedEstudiantes.has(est.correo));
    } else {
        this.selectAll = false; // No students to select
    }
}

  /**
   * Verifica si un estudiante está seleccionado
   */
  isSelected(correo: string): boolean {
    return this.selectedEstudiantes.has(correo);
  }

  /**
   * Verifica si los puntos de un estudiante fueron actualizados recientemente
   */
  isPuntosActualizados(correo: string): boolean {
    return this.puntosActualizados.has(correo);
  }

  /**
   * Obtiene la evaluación de un estudiante para una entrega
   */
  getEvaluacion(correo: string, entrega: string): Evaluacion | null { // Return type Evaluacion | null
    if (!this.curso?.evaluaciones) return null;

    const entregaKey = entrega as keyof typeof this.curso.evaluaciones;
    const evaluacionesEntrega = this.curso.evaluaciones[entregaKey];

    // Ensure evaluations for the delivery exist and the student's evaluation exists
    return (evaluacionesEntrega && evaluacionesEntrega[correo]) ? evaluacionesEntrega[correo] : null;
  }

  /**
   * Abre la evaluación para un estudiante
   */
  abrirEvaluacion(estudiante: Estudiante): void {
    console.log('Iniciando evaluación para:', estudiante);
    this.iniciarEvaluacion(estudiante);
  }

  /**
   * Exporta los datos del curso
   */
  async exportarCurso(): Promise<void> {
    if (!this.cursoId || !this.curso) {
        this.showAlert('Error', 'No hay curso cargado para exportar.');
        return;
    }
    try {
      const csv = await this.cursoService.exportCursoToCSV(this.cursoId);
      const filename = `${this.curso?.nombre.replace(/[\s/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;

      // En web, descargar el archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); // Added charset
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link); // Append link to body to ensure click works in all browsers
      link.click();
      document.body.removeChild(link); // Clean up link
      window.URL.revokeObjectURL(url);

      await this.showToast('Curso exportado correctamente'); // Use showToast
    } catch (error: any) {
      console.error('Error al exportar:', error);
      await this.showAlert('Error', 'No se pudo exportar el curso');
    }
  }

  /**
   * Regresa a la página anterior
   */
  goBack(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Alterna la visibilidad del panel de seguimiento
   */
  toggleSeguimiento(): void {
    this.showSeguimiento = !this.showSeguimiento;
  }

  /**
   * Maneja el cambio de entrega activa
   * Changed event type from 'any' to CustomEvent for Ionic components
   */
  onEntregaChange(event: CustomEvent): void {
    this.entregaActiva = event.detail.value as 'E1' | 'E2' | 'EF'; // Type assertion
    // Si hay un subgrupo seleccionado, activar rúbrica grupal automáticamente
    if (this.subgrupoSeleccionado && this.subgrupoSeleccionado !== '') {
      this.activarRubricaGrupal(this.subgrupoSeleccionado);
    } else if (this.evaluacionActual.estudiante) {
      // If an individual student is selected, reload their evaluation for the new 'entrega'
      this.iniciarEvaluacion(this.evaluacionActual.estudiante);
    }
  }

  /**
   * Selecciona un subgrupo y activa la rúbrica grupal correspondiente
   */
  seleccionarSubgrupo(subgrupo: string): void {
    this.subgrupoSeleccionado = subgrupo;

    if (subgrupo === '') {
      // Todos los grupos - desactivar evaluación grupal
      this.evaluacionGrupalActiva = false;
      this.limpiarEvaluacionGrupal();
      this.mostrarResumen = false; // Ocultar resumen al cambiar de grupo
      // Mantener la evaluación individual si estaba activa
      if (this.evaluacionActual.estudiante) {
          this.iniciarEvaluacion(this.evaluacionActual.estudiante); // Recargar eval individual
      }
    } else {
      // Subgrupo específico - activar evaluación grupal
      this.activarRubricaGrupal(subgrupo);
      // Limpiar evaluación individual al activar grupal
      this.evaluacionActual.estudiante = null;
      this.evaluacionActual.esGrupal = false; // Ensure this is false when activating group eval
      this.mostrarResumen = false; // Ocultar resumen al seleccionar nuevo grupo
    }

    // Aplicar filtro a la tabla
    this.subgrupoFilter = subgrupo;
    this.applyFilters();
  }

  /**
   * Activa la rúbrica grupal para un subgrupo específico
   */
  private activarRubricaGrupal(subgrupo: string): void {
    this.evaluacionGrupalActiva = true;

    // Inicializar evaluación grupal (sin asignar estudiante específico)
    this.evaluacionGrupal = {
      subgrupo: subgrupo,
      entrega: this.entregaActiva,
      criterios: {},
      comentariosCriterios: {},
      ajustesPuntaje: {},
      comentarios: '',
      fecha: new Date().toISOString()
    };

    // Cargar evaluación grupal existente si existe
    this.cargarEvaluacionGrupalExistente(subgrupo, this.entregaActiva);

    console.log(`Rúbrica grupal activada para ${subgrupo} en entrega ${this.entregaActiva}`);
  }

  /**
   * Limpia la evaluación grupal
   */
  private limpiarEvaluacionGrupal(): void {
    this.evaluacionGrupal = {
      subgrupo: '',
      entrega: this.entregaActiva,
      criterios: {},
      comentariosCriterios: {},
      ajustesPuntaje: {},
      comentarios: '',
      fecha: new Date().toISOString()
    };
  }

  /**
   * Cancela la evaluación actual (individual o grupal)
   */
  cancelarEvaluacion(): void {
    if (this.evaluacionGrupalActiva) {
      // Limpiar solo los criterios y comentarios, mantener el grupo seleccionado
      this.evaluacionGrupal.criterios = {};
      this.evaluacionGrupal.comentariosCriterios = {};
      this.evaluacionGrupal.ajustesPuntaje = {};
      this.evaluacionGrupal.comentarios = '';
      // Ocultar resumen al cancelar
      this.mostrarResumen = false;
      // Mantener evaluacionGrupalActiva = true y subgrupoSeleccionado
      this.showToast('Evaluación cancelada');
    } else if (this.evaluacionActual.estudiante) {
        // Clear evaluation data but keep the student selected
        this.evaluacionActual.criterios = {};
        this.evaluacionActual.comentariosCriterios = {};
        this.evaluacionActual.ajustesPuntaje = {};
        this.evaluacionActual.comentarios = '';
        this.showToast('Evaluación cancelada');
    } else {
        // No evaluation active, perhaps reset panel state if needed
        this.evaluacionGrupalActiva = false;
        this.subgrupoSeleccionado = '';
        this.limpiarEvaluacionGrupal();
    }
  }

  /**
   * Actualiza la vista de evaluaciones en la tabla
   */
  private actualizarVistaEvaluaciones(): void {
    // Forzar detección de cambios para actualizar la tabla
    // Esto asegura que los puntos se muestren inmediatamente
    if (this.curso) {
      // Marcar estudiantes actualizados para efecto visual
      if (this.evaluacionGrupalActiva) {
        // Marcar todos los estudiantes del subgrupo como actualizados
        const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === this.evaluacionGrupal.subgrupo);
        estudiantesGrupo.forEach(est => {
          this.puntosActualizados.add(est.correo);
        });
      } else if (this.evaluacionActual.estudiante) {
        // Marcar solo el estudiante actual como actualizado
        this.puntosActualizados.add(this.evaluacionActual.estudiante.correo);
      }

      // Re-aplicar filtros para refrescar la vista
      // Note: Re-applying filters might not be enough if the object reference didn't change deep inside curso.evaluaciones
      // Force Angular change detection if necessary, or ensure immutability
      this.applyFilters();


      // Limpiar indicadores después de un tiempo
      setTimeout(() => {
        this.puntosActualizados.clear();
         // Force update again after clearing the visual indicator if necessary
         this.applyFilters();
      }, 2000);
    }
  }

  /**
   * Obtiene el total de estudiantes
   */
  getTotalEstudiantes(): number {
    return this.estudiantes.length;
  }

  /**
   * Obtiene el ícono para un criterio
   */
  getCriterioIcon(codigo: string): string {
    const iconMap: { [key: string]: string } = {
      'documento_inicial': 'document-text-outline',
      'planteamiento_objetivos': 'locate-outline',
      'requerimientos': 'list-outline',
      'flujo_navegacion': 'git-network-outline',
      'mockups_wireframes': 'phone-portrait-outline',
      'atencion_ajustes_tutor': 'build-outline',
      'flujo_navegacion_mockups': 'git-network-outline',
      'requerimientos_actualizados': 'refresh-outline',
      'implementacion_interfaces': 'laptop-outline',
      'desarrollo_requerimientos': 'code-working-outline',
      'video': 'videocam-outline',
      'cumplimiento_requerimientos': 'checkmark-done-outline',
      'calidad_codigo_arquitectura': 'construct-outline',
      'arte_final_experiencia_usuario': 'color-palette-outline',
      'participacion_colaboracion': 'people-outline',
      'responsabilidad_cumplimiento': 'timer-outline',
      'comunicacion_presentacion': 'megaphone-outline',
      'conocimiento_tecnico': 'terminal-outline'
    };
    return iconMap[codigo] || 'help-outline';
  }

  /**
   * Obtiene el color para un criterio
   */
  getCriterioColor(codigo: string): string {
    // Simple cycling through colors for variety
    const colors = ['primary', 'secondary', 'tertiary', 'success', 'warning'];
    const hashCode = codigo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hashCode % colors.length];
  }

  /**
   * Selecciona un nivel para un criterio (refactorizado)
   */
  selectNivel(criterioCodigo: string, valor: number): void {
    const isGrupal = this.evaluacionGrupalActiva;
    const targetEval = isGrupal ? this.evaluacionGrupal : this.evaluacionActual;

    if (!isGrupal && !(targetEval as typeof this.evaluacionActual).estudiante) {
      this.showAlert('Error', 'Debe seleccionar un estudiante para evaluar individualmente');
      return;
    }
    if (isGrupal && !(targetEval as typeof this.evaluacionGrupal).subgrupo) {
      this.showAlert('Error', 'Debe seleccionar un subgrupo para evaluar grupalmente');
      return;
    }

    // Toggle: if same value clicked, deselect (set to 0 or undefined)
    if (targetEval.criterios[criterioCodigo] === valor) {
        delete targetEval.criterios[criterioCodigo]; // O set to 0 if preferred
        valor = 0; // Para el log
    } else {
        targetEval.criterios[criterioCodigo] = valor;
    }


    const savePromise = isGrupal
      ? this.guardarEvaluacionGrupal()
      : this.guardarEvaluacionActual();

    savePromise.then(() => {
      this.actualizarVistaEvaluaciones();
      const targetName = isGrupal ? (targetEval as typeof this.evaluacionGrupal).subgrupo : (targetEval as typeof this.evaluacionActual).estudiante?.nombres;
      this.showToast(`Puntos ${isGrupal ? 'grupales' : 'individuales'} actualizados: ${targetName} - ${valor} pts`);
      console.log(`Evaluando ${isGrupal ? 'grupo ' + (targetEval as typeof this.evaluacionGrupal).subgrupo : targetName}: ${criterioCodigo} = ${valor} puntos`);
    }).catch(error => {
        console.error(`Error al guardar evaluación ${isGrupal ? 'grupal' : 'individual'}:`, error);
        this.showAlert('Error', `No se pudo guardar la evaluación ${isGrupal ? 'grupal' : 'individual'}`);
    });
  }

  /**
   * Obtiene el valor seleccionado para un criterio
   */
  getCriterioValue(criterio: string): number | null {
    if (this.evaluacionGrupalActiva) {
      return this.evaluacionGrupal.criterios[criterio] ?? null; // Use ?? null
    } else {
      if (!this.evaluacionActual.estudiante) return null;
      return this.evaluacionActual.criterios[criterio] ?? null; // Use ?? null
    }
  }


  /**
   * Abre el modal de comentarios para un criterio
   */
  async abrirComentarios(codigoCriterio: string, nombreCriterio: string): Promise<void> {
    console.log('Abriendo comentarios para:', codigoCriterio, nombreCriterio);

    const isGrupal = this.evaluacionGrupalActiva;
    const targetEval = isGrupal ? this.evaluacionGrupal : this.evaluacionActual;

    // Check if an evaluation is active
    if ((!isGrupal && !this.evaluacionActual.estudiante) || (isGrupal && !this.evaluacionGrupal.subgrupo)) {
        this.showAlert('Error', 'Seleccione un estudiante o active la evaluación grupal primero.');
        return;
    }


    const comentariosActuales = targetEval.comentariosCriterios[codigoCriterio] || '';
    // Obtener puntaje base (antes de ajustes)
    const nivelSeleccionado = targetEval.criterios[codigoCriterio];
    const criterioDef = this.getCriteriosEntregaActiva().find(c => c.codigo === codigoCriterio);
    const nivel = criterioDef?.niveles.find((n: any) => n.valor === nivelSeleccionado);
    const puntajeBase = nivel ? nivel.valor : 0; // O el valor seleccionado si no hay niveles? No, el valor base del nivel.
                                                 // Esto es ambiguo. Asumamos que puntajeOriginal es el puntaje *antes* de este ajuste.
                                                 // El puntaje guardado en `criterios` YA incluye el ajuste.
                                                 // Necesitamos el puntaje base del nivel SELECCIONADO.

    const ajusteActual = targetEval.ajustesPuntaje[codigoCriterio] || 0;
    // Si hay un ajuste, el puntaje original (base) es el puntaje guardado MENOS el ajuste.
    // O, si no hay ajuste, es el puntaje guardado.
    // O, si no hay puntaje guardado, es 0.
    const puntajeGuardado = targetEval.criterios[codigoCriterio] ?? 0;
    const puntajeOriginal = puntajeGuardado - ajusteActual; // Esto recalcula el puntaje base del nivel

    try {
      const modal = await this.modalController.create({
        component: ComentariosModalComponent,
        componentProps: {
          criterioNombre: nombreCriterio,
          comentarios: comentariosActuales,
          puntajeOriginal: puntajeOriginal, // Puntaje base del nivel
          ajustePuntaje: ajusteActual, // Ajuste actual
          comentariosComunes: this.comentariosComunes
        }
      });

      await modal.present();
      console.log('Modal presentado');

      const { data, role } = await modal.onWillDismiss<ComentariosModalData | null>();
      console.log('Modal cerrado con role:', role, 'data:', data);

      if (role === 'confirm' && data) {
        // Guardar como comentario común si se marcó
        if (data.guardarComoComun && data.comentarios.trim()) {
          this.guardarComentarioComun(data.comentarios.trim());
        }

        targetEval.comentariosCriterios[codigoCriterio] = data.comentarios;
        if (data.ajustePuntaje !== undefined) {
           targetEval.ajustesPuntaje[codigoCriterio] = data.ajustePuntaje;
           // Recalcular y guardar el puntaje final del criterio
           const puntajeFinal = Math.max(0, puntajeOriginal + data.ajustePuntaje); // Asegura que no sea negativo
           targetEval.criterios[codigoCriterio] = puntajeFinal;
        }

        // Guardar la evaluación completa (grupal o individual)
        const savePromise = isGrupal
            ? this.guardarEvaluacionGrupal()
            : this.guardarEvaluacionActual();

        await savePromise;
        this.actualizarVistaEvaluaciones(); // Actualiza la tabla principal si es necesario
        this.showToast('Comentario y ajuste guardados');
      }
    } catch (error: any) {
      console.error('Error al abrir/procesar modal de comentarios:', error);
      this.showAlert('Error', 'No se pudo guardar el comentario/ajuste');
    }
  }

  /**
   * Obtiene el rango de puntaje para un nivel
   */
  getRangoNivel(criterio: any, indiceNivel: number): string {
    const niveles = criterio.niveles;
    if (!niveles || indiceNivel >= niveles.length) return '';

    const nivelActual = niveles[indiceNivel];
    // const nivelSiguiente = niveles[indiceNivel + 1]; // No usado en lógica corregida
    const nivelAnterior = niveles[indiceNivel - 1];

    if (indiceNivel === 0) {
      // Primer nivel: desde 0 hasta el valor actual
      return `(0 - ${nivelActual.valor})`;
    } else if (indiceNivel === niveles.length - 1) {
      // Último nivel: desde el valor anterior + 1 hasta el máximo
       const min = nivelAnterior ? nivelAnterior.valor + 1 : nivelActual.valor;
      return `(${min} - ${criterio.maxPuntos})`;
    } else {
      // Niveles intermedios: desde valor anterior + 1 hasta valor actual
      const min = nivelAnterior ? nivelAnterior.valor + 1 : nivelActual.valor;
      return `(${min} - ${nivelActual.valor})`;
    }
  }

  /**
   * Guarda un comentario común para uso futuro
   */
  guardarComentarioComun(comentario: string): void {
    if (comentario && !this.comentariosComunes.includes(comentario)) {
      this.comentariosComunes.push(comentario);
      // Guardar en localStorage o DatabaseService
      localStorage.setItem('comentariosComunes', JSON.stringify(this.comentariosComunes));
      // TODO: Consider using DatabaseService for more robust storage
      // await this.databaseService.saveComentarioPredefinido('general', comentario);
      this.showToast('Comentario común guardado');
    }
  }

  /**
   * Carga comentarios comunes desde localStorage
   */
  private cargarComentariosComunes(): void {
    // Cargar desde defaults
    const defaults = [
        'Excelente trabajo, sigue así',
        'Buen desempeño, pero puede mejorar',
        'Necesita más participación en las actividades',
        'Cumplió con los objetivos planteados',
        'Faltó profundidad en el análisis',
        'Presenta avances significativos',
        'Requiere mayor compromiso con el equipo'
    ];
    let guardados: string[] = [];
    const guardadosJson = localStorage.getItem('comentariosComunes');

    if (guardadosJson) {
      try {
        const parsed = JSON.parse(guardadosJson);
        if (Array.isArray(parsed)) {
           guardados = parsed;
        }
      } catch (e: any) {
        console.error('Error cargando comentarios comunes:', e);
         // Reset to default if parsing fails
        localStorage.removeItem('comentariosComunes');
      }
    }
    // Combinar defaults y guardados, asegurando unicidad
    const combined = new Set([...defaults, ...guardados]);
    this.comentariosComunes = Array.from(combined);

    // TODO: Load from DatabaseService if implemented
    // this.comentariosComunes = await this.databaseService.getComentariosPredefinidos('general');
  }

  /**
   * Obtiene los niveles de la rúbrica activa (para encabezado global)
   */
  getNivelesRubrica(): any[] {
    const criterios = this.getCriteriosEntregaActiva();
    if (criterios.length > 0 && criterios[0].niveles) {
      return criterios[0].niveles; // Assuming all criteria share the same levels structure
    }
    return [];
  }

  /**
   * Calcula el total de puntos de la evaluación actual
   */
  calcularTotalEvaluacion(): number {
    const criterios = this.getCriteriosEntregaActiva();
    let total = 0;

    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    criterios.forEach((criterio: any) => {
      // Use criteria codes for lookup
      const valor = criteriosActivos[criterio.codigo];
      if (typeof valor === 'number') { // Ensure it's a number before adding
        total += valor;
      }
    });

    return total;
  }

  /**
   * Obtiene el máximo puntaje posible para la entrega actual
   */
  getMaximoPuntaje(): number {
    const criterios = this.getCriteriosEntregaActiva();
    return criterios.reduce((total: number, criterio: any) => total + (criterio.maxPuntos || 0), 0);
  }

  /**
   * Verifica si un nivel está seleccionado para un criterio específico
   */
  isNivelSelectedForCriterio(codigoCriterio: string, valorNivel: number): boolean {
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    return criteriosActivos[codigoCriterio] === valorNivel;
  }


  /**
   * Verifica si todos los criterios tienen el nivel en el índice especificado seleccionado
   */
  isTodosCriteriosConNivel(indiceNivel: number): boolean {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      return false;
    }

    const criterios = this.getCriteriosEntregaActiva();
     if (criterios.length === 0) return false; // No criteria, so can't be selected

    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    // Verificar si todos los criterios tienen el nivel en este índice seleccionado
    return criterios.every((criterio: any) => {
      // Ensure the nivel exists at this index for this specific criterio
      const valorEsperado = criterio.niveles?.[indiceNivel]?.valor;
      // Check if the expected value exists and matches the active evaluation's value
      return valorEsperado !== undefined && criteriosActivos[criterio.codigo] === valorEsperado;
    });
  }

  /**
   * Selecciona o deselecciona el mismo nivel (por índice) para todos los criterios (toggle)
   * Nota: indiceNivel es el índice del nivel (0=Insuficiente, 1=Aceptable, 2=Excelente)
   */
  selectNivelParaTodosCriterios(indiceNivel: number): void {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      this.showToast('Seleccione un estudiante o active la evaluación grupal primero');
      return;
    }

    const criterios = this.getCriteriosEntregaActiva();

    // Determine if all criteria currently have this level selected
    const todosTienenEsteNivel = this.isTodosCriteriosConNivel(indiceNivel);

    const targetEval = this.evaluacionGrupalActiva ? this.evaluacionGrupal : this.evaluacionActual;

    if (todosTienenEsteNivel) {
        // Deseleccionar: limpiar todos los criterios
        criterios.forEach((criterio: any) => {
            delete targetEval.criterios[criterio.codigo];
        });
        this.showToast('Nivel deseleccionado para todos los criterios');
    } else {
        // Seleccionar: aplicar el valor del nivel en este índice para cada criterio
        criterios.forEach((criterio: any) => {
            const valorNivel = criterio.niveles?.[indiceNivel]?.valor;
            if (valorNivel !== undefined) {
                targetEval.criterios[criterio.codigo] = valorNivel;
            }
        });
        this.showToast('Nivel aplicado a todos los criterios');
    }

    // Save the changes
    const savePromise = this.evaluacionGrupalActiva
        ? this.guardarEvaluacionGrupal()
        : this.guardarEvaluacionActual();

    savePromise.catch(error => {
        console.error("Error saving after bulk level select:", error);
        this.showAlert('Error', 'No se pudieron guardar los cambios masivos.');
    });
  }

  /**
   * Inicia la evaluación individual de un estudiante
   */
  iniciarEvaluacion(estudiante: Estudiante): void {
    // Desactivar evaluación grupal y limpiar subgrupo seleccionado
    this.evaluacionGrupalActiva = false;
    this.subgrupoSeleccionado = '';
    this.limpiarEvaluacionGrupal();
    this.mostrarResumen = false; // Ocultar resumen grupal

    // Iniciar evaluación individual
    this.evaluacionActual = {
      estudiante: estudiante,
      entrega: this.entregaActiva,
      criterios: {},
      comentariosCriterios: {},
      ajustesPuntaje: {},
      comentarios: '',
      fecha: new Date().toISOString(),
      esGrupal: false
    };

    // Cargar evaluación existente si existe
    this.cargarEvaluacionExistente(estudiante, this.entregaActiva);

    console.log(`Evaluación individual iniciada para ${estudiante.nombres} ${estudiante.apellidos}`);
  }

  /**
   * Carga una evaluación grupal existente
   */
  private async cargarEvaluacionGrupalExistente(subgrupo: string, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    try {
        const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);
        if (estudiantesGrupo.length === 0 || !this.curso?.evaluaciones) return;

        const entregaKey = entrega as keyof typeof this.curso.evaluaciones;
        const evaluacionesEntrega = this.curso.evaluaciones[entregaKey];

        // Find the first student with a group evaluation detail saved for this group/entrega
        let evaluacionRepresentativa: Evaluacion | undefined;
        for (const estudiante of estudiantesGrupo) {
            const evalEstudiante = evaluacionesEntrega?.[estudiante.correo];
            if (evalEstudiante?.grup_eval) {
                evaluacionRepresentativa = evalEstudiante;
                break;
            }
        }

         // Reset criteria before loading
        this.evaluacionGrupal.criterios = {};
        this.evaluacionGrupal.comentariosCriterios = {};
        this.evaluacionGrupal.ajustesPuntaje = {};

        if (evaluacionRepresentativa?.grup_eval) {
            const grupEval = evaluacionRepresentativa.grup_eval;
            const criteriosGuardados = grupEval.criterios || [];
            const criteriosActivos = this.getCriteriosEntregaActiva(); // Uses RUBRICAS_GRUPALES

            criteriosGuardados.forEach((criterioGuardado: any) => {
                const criterioConfig = criteriosActivos.find((c: any) => c.nombre === criterioGuardado.nombre);
                if (criterioConfig) {
                    this.evaluacionGrupal.criterios[criterioConfig.codigo] = criterioGuardado.points;
                    // Load comments and adjustments if they exist (using modern structure)
                    this.evaluacionGrupal.comentariosCriterios[criterioConfig.codigo] = (grupEval as any).comentariosCriterios?.[criterioConfig.codigo] || '';
                    this.evaluacionGrupal.ajustesPuntaje[criterioConfig.codigo] = (grupEval as any).ajustesPuntaje?.[criterioConfig.codigo] || 0;
                }
            });

            this.evaluacionGrupal.comentarios = grupEval.comentarios || '';
            console.log('Evaluación grupal cargada:', this.evaluacionGrupal.criterios);
        } else {
             console.log(`No group evaluation data found for ${subgrupo} in ${entrega}. Initializing.`);
              this.evaluacionGrupal.comentarios = ''; // Ensure general comments are also reset
        }
    } catch (error: any) {
        console.error('Error cargando evaluación grupal existente:', error);
    }
}


  /**
   * Carga una evaluación individual existente
   */
  private async cargarEvaluacionExistente(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    try {
        const evaluacionExistente = this.getEvaluacion(estudiante.correo, entrega);

         // Reset current eval criteria before loading
        this.evaluacionActual.criterios = {};
        this.evaluacionActual.comentariosCriterios = {};
        this.evaluacionActual.ajustesPuntaje = {};

        if (evaluacionExistente?.ind_eval) {
            const indEval = evaluacionExistente.ind_eval;
            const criteriosGuardados = indEval.criterios || [];
            const criteriosActivos = this.getCriteriosEntregaActiva(); // Uses RUBRICA_INDIVIDUAL

            criteriosGuardados.forEach((criterioGuardado: any) => {
                const criterioConfig = criteriosActivos.find((c: any) => c.nombre === criterioGuardado.nombre);
                if (criterioConfig) {
                    this.evaluacionActual.criterios[criterioConfig.codigo] = criterioGuardado.points;
                     // Load comments and adjustments if they exist (using modern structure)
                    this.evaluacionActual.comentariosCriterios[criterioConfig.codigo] = (indEval as any).comentariosCriterios?.[criterioConfig.codigo] || '';
                    this.evaluacionActual.ajustesPuntaje[criterioConfig.codigo] = (indEval as any).ajustesPuntaje?.[criterioConfig.codigo] || 0;
                }
            });

            this.evaluacionActual.comentarios = indEval.comentarios || '';
            console.log('Evaluación individual cargada:', this.evaluacionActual.criterios);
        } else {
             console.log(`No individual evaluation data found for ${estudiante.correo} in ${entrega}. Initializing.`);
              this.evaluacionActual.comentarios = ''; // Ensure general comments are also reset
        }
    } catch (error: any) {
        console.error('Error cargando evaluación existente:', error);
    }
}

  /**
   * Guarda la evaluación individual actual
   */
  private async guardarEvaluacionActual(): Promise<void> {
    if (!this.evaluacionActual.estudiante || !this.curso) return;

    try {
      // Convertir criterios a formato del modelo EvaluacionDetalle
      const criteriosArray: Criterio[] = this.getCriteriosEntregaActiva().map((criterioConfig: any) => {
        const valorSeleccionado = this.evaluacionActual.criterios[criterioConfig.codigo];
        const nivelSeleccionado = criterioConfig.niveles.find((n: any) => n.valor === valorSeleccionado);

        return {
          nombre: criterioConfig.nombre,
          descripcion: criterioConfig.peso, // Storing 'peso' in 'descripcion' field based on model
          selectedLevel: nivelSeleccionado?.valor, // Store selected value
          points: valorSeleccionado ?? 0, // Ensure points is a number, default 0
          niveles: criterioConfig.niveles.map((nivel: any) => ({
            nivel: nivel.valor, // Use 'valor' as 'nivel' identifier
            descripcion: nivel.descripcion,
            puntos: nivel.valor // Use 'valor' also as 'puntos' for simplicity here
          }))
        };
      });

      const totalScore = this.calcularTotalEvaluacion();

      const evaluacionDetalle: EvaluacionDetalle = {
        criterios: criteriosArray,
        totalScore: totalScore,
        comentarios: this.evaluacionActual.comentarios,
        fecha: this.evaluacionActual.fecha,
        // Include criteria comments and adjustments in the detailed evaluation object
        comentariosCriterios: this.evaluacionActual.comentariosCriterios,
        ajustesPuntaje: this.evaluacionActual.ajustesPuntaje
      } as any; // Cast to any temporarily if model doesn't match exactly yet

      // Ensure evaluations structure exists
      if (!this.curso.evaluaciones) {
        this.curso.evaluaciones = { E1: {}, E2: {}, EF: {} };
      }
      const entregaKey = this.evaluacionActual.entrega as keyof typeof this.curso.evaluaciones;
      if (!this.curso.evaluaciones[entregaKey]) {
        this.curso.evaluaciones[entregaKey] = {};
      }

      const entregaEvals = this.curso.evaluaciones[entregaKey];
      if (entregaEvals) {
        // Get existing evaluation to preserve group score
        const evaluacionExistente = entregaEvals[this.evaluacionActual.estudiante.correo];

        const evaluacionCompleta: Evaluacion = {
            correo: this.evaluacionActual.estudiante.correo,
            pg_score: evaluacionExistente?.pg_score, // Preserve existing group score
            pi_score: totalScore, // Set the new individual score
            ind_eval: evaluacionDetalle, // Store the detailed individual evaluation
            grup_eval: evaluacionExistente?.grup_eval, // Preserve existing group eval details
            sumatoria: totalScore + (evaluacionExistente?.pg_score ?? 0) // Recalculate sum
        };

        entregaEvals[this.evaluacionActual.estudiante.correo] = evaluacionCompleta;
      }

      // Guardar en la base de datos
      await this.databaseService.saveCurso(this.curso.id, this.curso);

      console.log('Evaluación individual guardada exitosamente');
    } catch (error: any) {
      console.error('Error guardando evaluación individual:', error);
      this.showAlert('Error', 'No se pudo guardar la evaluación individual');
      throw error; // Re-throw error for promise chain
    }
  }

  /**
   * Guarda la evaluación grupal
   */
  private async guardarEvaluacionGrupal(): Promise<void> {
    if (!this.evaluacionGrupal.subgrupo || !this.curso) return;

    try {
      // Convertir criterios a formato del modelo EvaluacionDetalle
      const criteriosArray: Criterio[] = this.getCriteriosEntregaActiva().map((criterioConfig: any) => {
         const valorSeleccionado = this.evaluacionGrupal.criterios[criterioConfig.codigo];
         const nivelSeleccionado = criterioConfig.niveles.find((n: any) => n.valor === valorSeleccionado);

        return {
          nombre: criterioConfig.nombre,
          descripcion: criterioConfig.peso, // Storing 'peso' in 'descripcion'
          selectedLevel: nivelSeleccionado?.valor,
          points: valorSeleccionado ?? 0, // Default 0
          niveles: criterioConfig.niveles.map((nivel: any) => ({
            nivel: nivel.valor,
            descripcion: nivel.descripcion,
            puntos: nivel.valor
          }))
        };
      });

      const totalScore = this.calcularTotalEvaluacion();

      const evaluacionDetalle: EvaluacionDetalle = {
        criterios: criteriosArray,
        totalScore: totalScore,
        comentarios: this.evaluacionGrupal.comentarios,
        fecha: this.evaluacionGrupal.fecha,
         // Include criteria comments and adjustments
        comentariosCriterios: this.evaluacionGrupal.comentariosCriterios,
        ajustesPuntaje: this.evaluacionGrupal.ajustesPuntaje
      } as any; // Cast to any temporarily

      // Obtener estudiantes del subgrupo para aplicar la evaluación grupal
      const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === this.evaluacionGrupal.subgrupo);

      // Ensure evaluations structure exists
      if (!this.curso.evaluaciones) {
        this.curso.evaluaciones = { E1: {}, E2: {}, EF: {} };
      }
      const entregaKey = this.evaluacionGrupal.entrega as keyof typeof this.curso.evaluaciones;
      if (!this.curso.evaluaciones[entregaKey]) {
        this.curso.evaluaciones[entregaKey] = {};
      }
      const entregaEvals = this.curso.evaluaciones[entregaKey];

      if (entregaEvals) {
        estudiantesGrupo.forEach(estudiante => {
          // Get existing evaluation to preserve individual score/details
          const evaluacionExistente = entregaEvals[estudiante.correo];

          const evaluacionCompleta: Evaluacion = {
            correo: estudiante.correo,
            pg_score: totalScore, // Set the new group score
            pi_score: evaluacionExistente?.pi_score, // Preserve existing individual score
            ind_eval: evaluacionExistente?.ind_eval, // Preserve existing individual eval details
            grup_eval: evaluacionDetalle, // Store the detailed group evaluation
            sumatoria: totalScore + (evaluacionExistente?.pi_score ?? 0) // Recalculate sum
          };

          entregaEvals[estudiante.correo] = evaluacionCompleta;
        });
      }

      // Guardar en la base de datos
      await this.databaseService.saveCurso(this.curso.id, this.curso);

      // Mostrar resumen después de guardar
      this.mostrarResumen = true;

      console.log(`Evaluación grupal guardada para ${this.evaluacionGrupal.subgrupo}`);
    } catch (error: any) {
      console.error('Error guardando evaluación grupal:', error);
      this.showAlert('Error', 'No se pudo guardar la evaluación grupal');
       throw error; // Re-throw error
    }
  }

  /**
   * Actualiza los comentarios de la evaluación (general, not per criteria)
   */
  actualizarComentarios(comentarios: string): void {
      // This method seems intended for general comments, not per-criteria
      // Currently, the save methods handle criteria comments. Let's adjust this for general comments.
    if (this.evaluacionGrupalActiva) {
      this.evaluacionGrupal.comentarios = comentarios;
      this.guardarEvaluacionGrupal(); // Re-save the whole group eval
    } else if (this.evaluacionActual.estudiante) {
      this.evaluacionActual.comentarios = comentarios;
      this.guardarEvaluacionActual(); // Re-save the individual eval
    }
  }

  /**
   * Obtiene el porcentaje de completitud de la evaluación
   */
  getPorcentajeCompletitud(): number {
    const total = this.calcularTotalEvaluacion();
    const maximo = this.getMaximoPuntaje();
    return maximo > 0 ? Math.round((total / maximo) * 100) : 0;
  }

  /**
   * Obtiene el texto de rendimiento según el porcentaje
   */
  getTextoRendimiento(): string {
    const porcentaje = this.getPorcentajeCompletitud();
    if (porcentaje === 0 && !this.isAnyCriterioEvaluated()) return 'Sin evaluar'; // Check if any criteria has value
    if (porcentaje < 40) return 'Malo';
    if (porcentaje < 60) return 'Deficiente';
    if (porcentaje < 75) return 'Aceptable';
    if (porcentaje < 90) return 'Bueno';
    return 'Excelente';
  }

  /**
   * Helper to check if any criteria has been evaluated
   */
  private isAnyCriterioEvaluated(): boolean {
      const criteriosActivos = this.evaluacionGrupalActiva
        ? this.evaluacionGrupal.criterios
        : this.evaluacionActual.criterios;
      return Object.keys(criteriosActivos).length > 0;
  }

  /**
   * Obtiene la clase CSS para el badge de progreso según rendimiento
   */
  getClaseRendimiento(): string {
    const porcentaje = this.getPorcentajeCompletitud();
     if (porcentaje === 0 && !this.isAnyCriterioEvaluated()) return 'ninguno'; // Add a default/none class
    if (porcentaje < 40) return 'malo';
    if (porcentaje < 60) return 'deficiente';
    if (porcentaje < 75) return 'aceptable';
    if (porcentaje < 90) return 'bueno';
    return 'excelente';
  }

  /**
   * Verifica si la evaluación está completa (todos los criterios tienen un valor)
   */
  isEvaluacionCompleta(): boolean {
    const criterios = this.getCriteriosEntregaActiva();
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    return criterios.every((criterio: any) =>
      criteriosActivos[criterio.codigo] !== undefined && criteriosActivos[criterio.codigo] !== null
    );
  }

  /**
   * Finaliza la evaluación actual y la guarda
   */
  async finalizarEvaluacion(): Promise<void> {
    if (!this.isEvaluacionCompleta()) {
      this.showAlert('Evaluación incompleta', 'Debe evaluar todos los criterios antes de finalizar.');
      return;
    }

    try {
      // Guardar evaluación final
      const isGrupal = this.evaluacionGrupalActiva;
      const savePromise = isGrupal ? this.guardarEvaluacionGrupal() : this.guardarEvaluacionActual();
      await savePromise;

      // Actualizar la vista de la tabla principal
      this.actualizarVistaEvaluaciones();

      // Mostrar resumen
      const total = this.calcularTotalEvaluacion();
      const maximo = this.getMaximoPuntaje();
      const porcentaje = this.getPorcentajeCompletitud(); // Use existing method

      let message = '';
      if (isGrupal) {
        message = `Evaluación grupal de ${this.evaluacionGrupal.subgrupo} finalizada.\n` +
                  `Puntuación: ${total}/${maximo} puntos (${porcentaje}%)`;
      } else if (this.evaluacionActual.estudiante) {
        message = `Evaluación de ${this.evaluacionActual.estudiante.nombres} finalizada.\n` +
                  `Puntuación: ${total}/${maximo} puntos (${porcentaje}%)`;
      }

      await this.showAlert('Evaluación completada', message);

      // Resetear el estado de evaluación activa (limpiar criterios, etc.) pero mantener selección
      if (isGrupal) {
          // Do not deactivate group eval automatically, keep it active for the selected group
          // this.evaluacionGrupalActiva = false; // Keep active
          // this.subgrupoSeleccionado = ''; // Keep selected
          // this.limpiarEvaluacionGrupal(); // Don't clear, maybe user wants to review/adjust
          this.mostrarResumen = true; // Ensure resumen is shown
      } else if (this.evaluacionActual.estudiante) {
          // Keep the student selected, maybe clear criteria for next potential eval? Or keep for review?
          // Decide based on desired UX flow. Let's keep it for review for now.
          // this.evaluacionActual.criterios = {};
          // this.evaluacionActual.comentariosCriterios = {};
          // this.evaluacionActual.ajustesPuntaje = {};
          // this.evaluacionActual.comentarios = '';
      }

    } catch (error: any) {
      console.error('Error finalizando evaluación:', error);
      this.showAlert('Error', 'No se pudo finalizar la evaluación.');
    }
  }


  /**
   * Obtiene los criterios de la entrega activa
   * Se usan las constantes definidas fuera de la clase
   */
  getCriteriosEntregaActiva(): any[] { // Considerar crear una interfaz para el retorno
    // Si hay evaluación grupal activa, mostrar rúbrica grupal
    if (this.evaluacionGrupalActiva && this.subgrupoSeleccionado && this.subgrupoSeleccionado !== '') {
      const entrega = this.entregaActiva as 'E1' | 'E2' | 'EF';
      // Usa la constante externa
      return RUBRICAS_GRUPALES[entrega] || RUBRICAS_GRUPALES['E1'];
    } else {
      // Usa la constante externa
      return RUBRICA_INDIVIDUAL;
    }
  }

  /**
   * Obtiene estadísticas de un criterio
   */
  getCriterioStats(codigo: string): any[] {
    // Obtener criterios específicos por entrega y tipo
    const criterios = this.getCriteriosEntregaActiva();
    const criterio = criterios.find((c: any) => c.codigo === codigo);

    if (!criterio) {
      return [
        { label: 'N/A', value: '0', color: 'var(--ion-color-medium)' }
      ];
    }

    // Generar estadísticas basadas en los niveles del criterio
    return criterio.niveles.map((nivel: any, index: number) => ({
      label: `${nivel.nombre.charAt(0)}(${nivel.valor})`,
      value: Math.floor(Math.random() * 3).toString(), // Datos de ejemplo
      color: index === 0 ? 'var(--ion-color-danger)' :
             index === 1 ? 'var(--ion-color-warning)' :
             'var(--ion-color-success)'
    }));
  }

  /**
   * Obtiene el resumen de criterios
   */
  getResumenCriterios(): any[] {
    return [
      {
        criterio: 'Criterio 1 (Justificación)',
        estadisticas: 'I(0), A(1), E(2) - Nivel Alcanzado: N/A (0 Puntos)'
      },
      {
        criterio: 'Criterio 2 (Objetivos)',
        estadisticas: 'I(1), A(2), E(3) - Nivel Alcanzado: N/A (0 Puntos)'
      },
      {
        criterio: 'Criterio 3 (Requerimientos)',
        estadisticas: 'I(4), A(8), E(10) - Nivel Alcanzado: N/A (0 Puntos)'
      },
      {
        criterio: 'Criterio 4 (Flujo de Navegación)',
        estadisticas: 'I(9), A(20), E(30) - Nivel Alcanzado: N/A (0 Puntos)'
      }
    ];
  }

  /**
   * Obtiene el resumen completo de la rúbrica para la entrega activa (para mostrar en sección resumen)
   */
  getResumenRubrica(): any[] { // Considerar crear una interfaz para el retorno
    if (!this.evaluacionGrupalActiva || !this.mostrarResumen) { // Only show if group eval was saved
      return [];
    }

    const criterios = this.getCriteriosEntregaActiva();
    const criteriosActivos = this.evaluacionGrupal.criterios;
    const comentariosCriterios = this.evaluacionGrupal.comentariosCriterios;

    return criterios.map((criterio: any) => {
      const valorSeleccionado = criteriosActivos[criterio.codigo];
      const nivelSeleccionado = criterio.niveles.find((n: any) => n.valor === valorSeleccionado);
      const comentario = comentariosCriterios[criterio.codigo] || '';

      // Construir información de niveles y rangos
      const nivelesInfo = criterio.niveles.map((nivel: any, index: number) =>
          `${nivel.nombre.charAt(0)}:${this.getRangoNivel(criterio, index)}`
      ).join(', ');


      return {
        nombre: criterio.nombre,
        peso: criterio.peso,
        nivelesInfo: nivelesInfo,
        nivelSeleccionado: nivelSeleccionado?.nombre || 'No evaluado',
        descripcion: nivelSeleccionado?.descripcion || '',
        puntos: valorSeleccionado ?? 0, // Default 0 if undefined
        comentario: comentario,
        tieneComentario: !!comentario
      };
    });
  }

  /**
   * Verifica si un criterio tiene comentario
   */
  tieneComentarioCriterio(codigoCriterio: string): boolean {
    const comentarios = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.comentariosCriterios :
      this.evaluacionActual.comentariosCriterios;

    return !!(comentarios && comentarios[codigoCriterio]?.trim()); // Check if exists and not empty
  }

  /**
   * Obtiene el rendimiento de una entrega específica
   * Changed parameter type from 'E1' | 'E2' | 'EF' to string
   */
  getRendimientoEntrega(entrega: string): string { // <-- Cambiado aquí
      const targetSubgrupo = this.evaluacionGrupal.subgrupo;
      const targetEstudiante = this.evaluacionActual.estudiante;
      // Use type assertion inside if needed, or validate the string
      const entregaKey = entrega as 'E1' | 'E2' | 'EF';
      const maximo = entregaKey === 'EF' ? 100 : 75; // Máximo puntaje base por entrega

      let evaluacion: Evaluacion | null = null;

      if (this.evaluacionGrupalActiva && targetSubgrupo) {
        // Obtener evaluación grupal del primer estudiante del grupo
        const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === targetSubgrupo);
        if (estudiantesGrupo.length > 0) {
            evaluacion = this.getEvaluacion(estudiantesGrupo[0].correo, entrega);
        }
      } else if (targetEstudiante) {
         evaluacion = this.getEvaluacion(targetEstudiante.correo, entrega);
      }

      if (evaluacion) {
        const total = evaluacion.sumatoria ?? 0; // Use sumatoria
        // Max score calculation might need to be more dynamic if rubricas change
        // const maximo = this.getMaximoPuntaje(); // This would get max for *active* entrega
        const porcentaje = maximo > 0 ? Math.round((total / maximo) * 100) : 0;
        return `${total}/${maximo} pts (${porcentaje}%) - ${this.getTextoRendimientoPorPorcentaje(porcentaje)}`;
      }

      return `0/${maximo} pts (0%) - Sin evaluar`;
  }

  /**
   * Obtiene el texto de rendimiento según un porcentaje dado
   */
  private getTextoRendimientoPorPorcentaje(porcentaje: number): string {
    if (porcentaje <= 0) return 'Sin evaluar'; // Changed from === 0
    if (porcentaje < 40) return 'Malo';
    if (porcentaje < 60) return 'Deficiente';
    if (porcentaje < 75) return 'Aceptable';
    if (porcentaje < 90) return 'Bueno';
    return 'Excelente';
  }

  /**
   * Muestra un alert
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
   * Muestra un toast de confirmación
   */
  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color,
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Abre menú contextual para editar o eliminar estudiante
   * Changed event type from 'any' to 'Event'
   */
  async abrirMenuContexto(estudiante: Estudiante, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    // Usar ActionSheetController para un look & feel más nativo
    const actionSheet = await this.actionSheetController.create({
        header: `${estudiante.nombres} ${estudiante.apellidos}`,
        subHeader: estudiante.correo,
        buttons: [
            { text: 'Editar E1', icon: 'create-outline', handler: () => this.abrirEditorPuntos(estudiante, 'E1') },
            { text: 'Editar E2', icon: 'create-outline', handler: () => this.abrirEditorPuntos(estudiante, 'E2') },
            { text: 'Editar EF', icon: 'create-outline', handler: () => this.abrirEditorPuntos(estudiante, 'EF') },
            { text: 'Eliminar estudiante', icon: 'trash-outline', role: 'destructive', handler: () => this.confirmarEliminacion(estudiante) },
            { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
        ] as ActionSheetButton[] // Tipado explícito
    });
    await actionSheet.present();
  }

  /**
   * Abre un editor para modificar puntos de forma inline
   */
  async abrirEditorPuntos(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    const evaluacion = this.getEvaluacion(estudiante.correo, entrega);
    const pgScore = evaluacion?.pg_score ?? ''; // Use ?? ''
    const piScore = evaluacion?.pi_score ?? ''; // Use ?? ''

    const alert = await this.alertController.create({
      header: `Editar ${entrega} - ${estudiante.nombres} ${estudiante.apellidos}`,
      inputs: [
        {
          name: 'pg_score',
          type: 'number',
          placeholder: 'PG (Puntos Grupal)',
          value: pgScore,
          min: 0, // Use number
          max: 100 // Use number
        },
        {
          name: 'pi_score',
          type: 'number',
          placeholder: 'PI (Puntos Individual)',
          value: piScore,
          min: 0, // Use number
          max: 100 // Use number
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data: PuntosEditadosData) => { // Tipado más específico para data
            await this.guardarPuntosEditados(estudiante, entrega, data);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Guarda los puntos editados
   * Changed data type from 'any' to 'PuntosEditadosData'
   */
  private async guardarPuntosEditados(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF', data: PuntosEditadosData): Promise<void> {
    try {
      // Convertir a número asegurándose de manejar undefined o string vacío
      const pgScoreNum = Number(data.pg_score ?? 0);
      const piScoreNum = Number(data.pi_score ?? 0);

      // Validar si son números válidos antes de usar (opcional pero recomendado)
      const pgScore = !isNaN(pgScoreNum) ? pgScoreNum : 0;
      const piScore = !isNaN(piScoreNum) ? piScoreNum : 0;
      const sumatoria = pgScore + piScore;

      // Actualizar la evaluación en el servicio
      // Re-usar la lógica de guardado existente
      if (!this.curso) throw new Error("Curso no está cargado.");
      if (!this.curso.evaluaciones) {
          this.curso.evaluaciones = { E1: {}, E2: {}, EF: {} };
      }
      const entregaKey = entrega as keyof typeof this.curso.evaluaciones;
      if (!this.curso.evaluaciones[entregaKey]) {
          this.curso.evaluaciones[entregaKey] = {};
      }
      const entregaEvals = this.curso.evaluaciones[entregaKey];
      if (!entregaEvals) throw new Error("Evaluaciones de entrega no encontradas.");

      const evaluacionExistente = entregaEvals[estudiante.correo] || { correo: estudiante.correo };

      const evaluacionCompleta: Evaluacion = {
        ...evaluacionExistente, // Preservar detalles existentes (ind_eval, grup_eval)
        correo: estudiante.correo,
        pg_score: pgScore,
        pi_score: piScore,
        sumatoria: sumatoria,
      };

      entregaEvals[estudiante.correo] = evaluacionCompleta;

      // Guardar en la base de datos
      await this.databaseService.saveCurso(this.curso.id, this.curso);

      await this.showToast(`Puntos de ${entrega} guardados correctamente`);
      // Refrescar la vista de la tabla
      this.actualizarVistaEvaluaciones(); // Usar el método existente
      // await this.loadCurso(); // Evitar recarga completa si es posible
    } catch (error: any) {
      console.error('Error al guardar puntos:', error);
      await this.showAlert('Error', `No se pudieron guardar los puntos: ${error?.message || error}`);
    }
  }

  /**
   * Confirma la eliminación de un estudiante del curso
   */
  private async confirmarEliminacion(estudiante: Estudiante): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${estudiante.nombres} ${estudiante.apellidos} de este curso? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.eliminarEstudiante(estudiante);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Elimina un estudiante del curso
   */
  private async eliminarEstudiante(estudiante: Estudiante): Promise<void> {
    try {
      if (this.curso) {
        // Eliminar del array local
        this.estudiantes = this.estudiantes.filter(e => e.correo !== estudiante.correo);
        this.estudiantesFiltrados = this.estudiantesFiltrados.filter(e => e.correo !== estudiante.correo);

        // Actualizar el curso en la base de datos
        this.curso.estudiantes = this.estudiantes;
        // TODO: Considerar eliminar también las evaluaciones de this.curso.evaluaciones
        if (this.curso.evaluaciones) {
            const evaluaciones = this.curso.evaluaciones; // Create a local reference that TypeScript knows is non-null
            (Object.keys(evaluaciones) as Array<keyof typeof evaluaciones>).forEach(entregaKey => {
                const entregaEvals = evaluaciones[entregaKey];
                if (entregaEvals && entregaEvals[estudiante.correo]) {
                    delete entregaEvals[estudiante.correo];
                }
            });
        }

        await this.databaseService.saveCurso(this.cursoId, this.curso);
         // Podríamos también llamar a un método específico en DatabaseService
         // await this.databaseService.deleteEstudiante(this.cursoId, estudiante.correo);

        await this.showToast(`${estudiante.nombres} ${estudiante.apellidos} ha sido eliminado del curso`, 'success');
        this.applyFilters(); // Refrescar la vista
      }
    } catch (error: any) {
      console.error('Error al eliminar estudiante:', error);
      await this.showAlert('Error', `No se pudo eliminar el estudiante: ${error?.message || error}`);
    }
  }
}


