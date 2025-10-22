import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonSegment, IonSegmentButton,
  IonLabel, IonSpinner, IonCheckbox,
  AlertController, ModalController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack, filterOutline, downloadOutline, addOutline, searchOutline,
  analyticsOutline, close, checkmarkCircleOutline, warningOutline, alertCircleOutline,
  documentTextOutline, locateOutline, listOutline, gitNetworkOutline, phonePortraitOutline,
  helpOutline, megaphoneOutline, flag
} from 'ionicons/icons';

import { CursoService } from '../../core/services/curso.service';
import { DatabaseService } from '../../core/services/database.service';
import { Curso } from '../../core/models/curso.model';
import { Estudiante } from '../../core/models/estudiante.model';
import { Evaluacion } from '../../core/models/evaluacion.model';
import { ComentariosModalComponent } from './comentarios-modal.component';

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
})
export class CursoDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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
  entregaActiva = 'E1';

  // Panel de seguimiento
  showSeguimiento = false;
  subgrupoActual = 'G1';
  subgrupoSeleccionado = ''; // Para controlar el subgrupo seleccionado
  evaluacionGrupalActiva = false; // Para controlar si la rúbrica grupal está activa
  mostrarResumen = false; // Para mostrar el resumen después de guardar evaluación grupal

    // Rúbricas grupales basadas en documentos académicos oficiales
  private rubricasGrupales = {
    'E1': [
      {
        codigo: 'documento_inicial',
        nombre: 'Documento Inicial',
        peso: '(5)',
        maxPuntos: 5,
        niveles: [
          { valor: 1, nombre: 'Insuficiente', descripcion: 'Sin formato o incompleto.' },
          { valor: 3, nombre: 'Aceptable', descripcion: 'Formato básico adecuado.' },
          { valor: 5, nombre: 'Excelente', descripcion: 'Formato profesional y portada completa.' }
        ]
      },
      {
        codigo: 'planteamiento_objetivos',
        nombre: 'Planteamiento y Objetivos',
        peso: '(5)',
        maxPuntos: 5,
        niveles: [
          { valor: 1, nombre: 'Insuficiente', descripcion: 'Objetivos vagos o incompletos.' },
          { valor: 3, nombre: 'Aceptable', descripcion: 'Objetivos claros con algunos detalles.' },
          { valor: 5, nombre: 'Excelente', descripcion: 'Objetivos SMART.' }
        ]
      },
      {
        codigo: 'requerimientos',
        nombre: 'Requerimientos',
        peso: '(10)',
        maxPuntos: 10,
        niveles: [
          { valor: 4, nombre: 'Insuficiente', descripcion: 'Lista incompleta o confusa.' },
          { valor: 7, nombre: 'Aceptable', descripcion: 'Identifica la mayoría.' },
          { valor: 10, nombre: 'Excelente', descripcion: 'Identifica exhaustivamente todos.' }
        ]
      },
      {
        codigo: 'flujo_navegacion',
        nombre: 'Flujo de Navegación',
        peso: '(30)',
        maxPuntos: 30,
        niveles: [
          { valor: 9, nombre: 'Insuficiente', descripcion: 'Confuso o incompleto.' },
          { valor: 20, nombre: 'Aceptable', descripcion: 'Flujo funcional y comprensible.' },
          { valor: 30, nombre: 'Excelente', descripcion: 'Flujo completo, claro y detallado.' }
        ]
      },
      {
        codigo: 'mockups_wireframes',
        nombre: 'Mockups y Wireframes',
        peso: '(25)',
        maxPuntos: 25,
        niveles: [
          { valor: 7, nombre: 'Insuficiente', descripcion: 'Básicos o de baja calidad.' },
          { valor: 17, nombre: 'Aceptable', descripcion: 'Mockups funcionales.' },
          { valor: 25, nombre: 'Excelente', descripcion: 'Mockups completos y profesionales.' }
        ]
      }
    ],
    'E2': [
      {
        codigo: 'atencion_ajustes_tutor',
        nombre: 'Atención de ajustes del tutor',
        peso: '(5)',
        maxPuntos: 5,
        niveles: [
          { valor: 1, nombre: 'Insuficiente', descripcion: 'Menos del 70% de comentarios atendidos, ajustes superficiales o incompletos.' },
          { valor: 3, nombre: 'Aceptable', descripcion: 'Se atendió el 70-90% de los comentarios con algunos detalles pendientes.' },
          { valor: 5, nombre: 'Excelente', descripcion: 'Todos los comentarios se atendieron de manera completa y pertinente.' }
        ]
      },
      {
        codigo: 'flujo_navegacion_mockups',
        nombre: 'Flujo de navegación y mockups',
        peso: '(10)',
        maxPuntos: 10,
        niveles: [
          { valor: 4, nombre: 'Insuficiente', descripcion: 'Flujo confuso, incompleto o sin lógica clara.' },
          { valor: 7, nombre: 'Aceptable', descripcion: 'Flujo comprensible con inconsistencias menores.' },
          { valor: 10, nombre: 'Excelente', descripcion: 'Flujo completo, lógico e intuitivo con mockups bien diseñados.' }
        ]
      },
      {
        codigo: 'requerimientos_actualizados',
        nombre: 'Requerimientos actualizados',
        peso: '(10)',
        maxPuntos: 10,
        niveles: [
          { valor: 4, nombre: 'Insuficiente', descripcion: 'Incompletos, desactualizados o mal redactados.' },
          { valor: 7, nombre: 'Aceptable', descripcion: 'Presentes y actualizados, pero con falta de claridad o detalle.' },
          { valor: 10, nombre: 'Excelente', descripcion: 'Completos, bien redactados, actualizados y coherentes.' }
        ]
      },
      {
        codigo: 'implementacion_interfaces',
        nombre: 'Implementación de interfaces (70%)',
        peso: '(20)',
        maxPuntos: 20,
        niveles: [
          { valor: 9, nombre: 'Insuficiente', descripcion: 'Menos del 60% de interfaces, errores significativos.' },
          { valor: 15, nombre: 'Aceptable', descripcion: '60-89% de interfaces, errores menores.' },
          { valor: 20, nombre: 'Excelente', descripcion: '90-100% de interfaces, navegación correcta.' }
        ]
      },
      {
        codigo: 'desarrollo_requerimientos',
        nombre: 'Desarrollo de requerimientos',
        peso: '(30)',
        maxPuntos: 30,
        niveles: [
          { valor: 14, nombre: 'Insuficiente', descripcion: 'Menos del 50% implementado, errores significativos.' },
          { valor: 23, nombre: 'Aceptable', descripcion: '50-79% implementado, lógica con errores menores.' },
          { valor: 30, nombre: 'Excelente', descripcion: '80-100% implementado, lógica correcta y buenas prácticas.' }
        ]
      }
    ],
    'EF': [
      {
        codigo: 'video',
        nombre: 'Video',
        peso: '(10)',
        maxPuntos: 10,
        niveles: [
          { valor: 4, nombre: 'Insuficiente', descripcion: 'El video no es claro, no muestra toda la funcionalidad o tiene mala calidad.' },
          { valor: 7, nombre: 'Aceptable', descripcion: 'El video es claro, pero no cubre toda la funcionalidad o tiene detalles de calidad.' },
          { valor: 10, nombre: 'Excelente', descripcion: 'Video claro, conciso, que demuestra toda la funcionalidad principal.' }
        ]
      },
      {
        codigo: 'cumplimiento_requerimientos',
        nombre: 'Cumplimiento de Requerimientos',
        peso: '(65)',
        maxPuntos: 65,
        niveles: [
          { valor: 16, nombre: 'Insuficiente', descripcion: 'Menos del 70% de los requerimientos funcionales implementados.' },
          { valor: 41, nombre: 'Aceptable', descripcion: 'Entre el 70% y 90% de los requerimientos funcionales implementados.' },
          { valor: 65, nombre: 'Excelente', descripcion: 'Más del 90% de los requerimientos funcionales implementados.' }
        ]
      },
      {
        codigo: 'calidad_codigo_arquitectura',
        nombre: 'Calidad del Código y Arquitectura',
        peso: '(15)',
        maxPuntos: 15,
        niveles: [
          { valor: 5, nombre: 'Insuficiente', descripcion: 'El código es desorganizado, difícil de leer o no sigue patrones de arquitectura.' },
          { valor: 10, nombre: 'Aceptable', descripcion: 'El código es legible y sigue principios básicos de arquitectura, pero tiene áreas de mejora.' },
          { valor: 15, nombre: 'Excelente', descripcion: 'Código limpio, bien documentado y sigue patrones de arquitectura MVC/MVVM.' }
        ]
      },
      {
        codigo: 'arte_final_experiencia_usuario',
        nombre: 'Arte Final y Experiencia de Usuario',
        peso: '(10)',
        maxPuntos: 10,
        niveles: [
          { valor: 4, nombre: 'Insuficiente', descripcion: 'La interfaz es poco atractiva, inconsistente o difícil de usar.' },
          { valor: 7, nombre: 'Aceptable', descripcion: 'La interfaz es funcional y consistente, pero visualmente simple.' },
          { valor: 10, nombre: 'Excelente', descripcion: 'Interfaz atractiva, consistente y ofrece una excelente experiencia de usuario.' }
        ]
      }
    ]
  };

  // Rúbrica individual (igual para todas las entregas)
  private rubricaIndividual = [
    {
      codigo: 'participacion_colaboracion',
      nombre: 'Participación y Colaboración',
      peso: '(20)',
      maxPuntos: 20,
      niveles: [
        { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'Participación mínima o nula. No muestra interés ni aporta.' },
        { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Participa ocasionalmente con aportes limitados.' },
        { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Participación activa y constante. Lidera iniciativas.' }
      ]
    },
    {
      codigo: 'responsabilidad_cumplimiento',
      nombre: 'Responsabilidad y Cumplimiento',
      peso: '(20)',
      maxPuntos: 20,
      niveles: [
        { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'No cumple con responsabilidades asignadas.' },
        { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Cumple parcialmente, algunas tareas quedan pendientes.' },
        { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Cumple puntualmente con todas las tareas asignadas.' }
      ]
    },
    {
      codigo: 'comunicacion_presentacion',
      nombre: 'Comunicación y Presentación',
      peso: '(20)',
      maxPuntos: 20,
      niveles: [
        { valor: 6, nombre: 'Insuficiente (0-6)', descripcion: 'Comunicación deficiente o poco clara.' },
        { valor: 13, nombre: 'Aceptable (7-13)', descripcion: 'Comunicación básica pero efectiva.' },
        { valor: 20, nombre: 'Excelente (14-20)', descripcion: 'Comunicación clara, efectiva y profesional.' }
      ]
    },
    {
      codigo: 'conocimiento_tecnico',
      nombre: 'Conocimiento Técnico',
      peso: '(15)',
      maxPuntos: 15,
      niveles: [
        { valor: 4, nombre: 'Insuficiente (0-4)', descripcion: 'Conocimiento técnico insuficiente o nulo.' },
        { valor: 10, nombre: 'Aceptable (5-10)', descripcion: 'Conocimiento técnico básico pero funcional.' },
        { valor: 15, nombre: 'Excelente (11-15)', descripcion: 'Dominio técnico sólido y aplicado eficazmente.' }
      ]
    }
  ];

  // Estado de evaluación actual
  evaluacionActual = {
    estudiante: null as Estudiante | null,
    entrega: 'E1' as string,
    criterios: {} as { [criterio: string]: number },
    comentariosCriterios: {} as { [criterio: string]: string },
    ajustesPuntaje: {} as { [criterio: string]: number }, // Nuevo: para guardar ajustes de puntaje
    comentarios: '',
    fecha: new Date().toISOString(),
    esGrupal: false as boolean
  };

  // Estado de evaluación grupal independiente
  evaluacionGrupal = {
    subgrupo: '' as string,
    entrega: 'E1' as string,
    criterios: {} as { [criterio: string]: number },
    comentariosCriterios: {} as { [criterio: string]: string },
    ajustesPuntaje: {} as { [criterio: string]: number }, // Nuevo: para guardar ajustes de puntaje
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
      helpOutline, megaphoneOutline, flag
    });

    // Cargar comentarios comunes guardados
    this.cargarComentariosComunes();
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id') || '';
    await this.loadCurso();
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
        this.applyFilters();
      }

      this.isLoading = false;
    } catch (error) {
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

    this.subgrupos = Array.from(subgruposSet).sort();
  }

  /**
   * Obtiene los subgrupos ordenados ascendentemente
   */
  getSubgruposOrdenados(): string[] {
    return [...this.subgrupos].sort((a, b) => {
      // Ordenamiento natural para G1, G2, G3, etc.
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
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
  }

  /**
   * Maneja cambio en búsqueda
   */
  onSearchChange(event: any): void {
    this.searchText = event.detail.value || '';
    this.applyFilters();
  }

  /**
   * Maneja cambio en filtro de subgrupo
   */
  onSubgrupoChange(event: any): void {
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
   */
  toggleSelectAll(event: any): void {
    const checked = event.detail.checked;

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
    this.selectAll = this.estudiantesFiltrados.length > 0 &&
      this.estudiantesFiltrados.every(est => this.selectedEstudiantes.has(est.correo));
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
  getEvaluacion(correo: string, entrega: string): any {
    if (!this.curso?.evaluaciones) return null;

    const evaluacionesEntrega = this.curso.evaluaciones[entrega as keyof typeof this.curso.evaluaciones];
    return evaluacionesEntrega ? evaluacionesEntrega[correo] : null;
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
    try {
      const csv = await this.cursoService.exportCursoToCSV(this.cursoId);
      const filename = `${this.curso?.nombre.replace(/\s+/g, '_')}_${Date.now()}.csv`;

      // En web, descargar el archivo
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      await this.showAlert('Éxito', 'Curso exportado correctamente');
    } catch (error) {
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
   */
  onEntregaChange(event: any): void {
    this.entregaActiva = event.detail.value;
    // Si hay un subgrupo seleccionado, activar rúbrica grupal automáticamente
    if (this.subgrupoSeleccionado && this.subgrupoSeleccionado !== '') {
      this.activarRubricaGrupal(this.subgrupoSeleccionado);
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
      this.evaluacionActual.estudiante = null;
      this.evaluacionActual.esGrupal = false;
      this.limpiarEvaluacionGrupal();
      this.mostrarResumen = false; // Ocultar resumen al cambiar de grupo
    } else {
      // Subgrupo específico - activar evaluación grupal
      this.activarRubricaGrupal(subgrupo);
      // Limpiar evaluación individual al activar grupal
      this.evaluacionActual.estudiante = null;
      this.evaluacionActual.esGrupal = false;
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
    } else {
      this.evaluacionActual.estudiante = null;
      this.evaluacionActual.criterios = {};
      this.evaluacionActual.comentarios = '';
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
      this.applyFilters();

      // Limpiar indicadores después de un tiempo
      setTimeout(() => {
        this.puntosActualizados.clear();
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
      'justificacion': 'document-text-outline',
      'objetivos': 'locate-outline',
      'requerimientos': 'list-outline',
      'flujo': 'git-network-outline',
      'mockups': 'phone-portrait-outline'
    };
    return iconMap[codigo] || 'help-outline';
  }

  /**
   * Obtiene el color para un criterio
   */
  getCriterioColor(codigo: string): string {
    const colorMap: { [key: string]: string } = {
      'justificacion': 'primary',
      'objetivos': 'secondary',
      'requerimientos': 'tertiary',
      'flujo': 'success',
      'mockups': 'warning'
    };
    return colorMap[codigo] || 'medium';
  }

  /**
   * Selecciona un nivel para un criterio
   */
  selectNivel(criterio: string, valor: number): void {
    if (this.evaluacionGrupalActiva) {
      // Evaluación grupal
      if (!this.evaluacionGrupal.subgrupo) {
        this.showAlert('Error', 'Debe seleccionar un subgrupo para evaluar');
        return;
      }

      this.evaluacionGrupal.criterios[criterio] = valor;
      this.guardarEvaluacionGrupal().then(() => {
        this.actualizarVistaEvaluaciones();
        this.showToast(`Puntos grupales actualizados: ${this.evaluacionGrupal.subgrupo} - ${valor} pts`);
      });
      console.log(`Evaluando grupo ${this.evaluacionGrupal.subgrupo}: ${criterio} = ${valor} puntos`);
    } else {
      // Evaluación individual
      if (!this.evaluacionActual.estudiante) {
        this.showAlert('Error', 'Debe seleccionar un estudiante para evaluar');
        return;
      }

      this.evaluacionActual.criterios[criterio] = valor;
      this.guardarEvaluacionActual().then(() => {
        this.actualizarVistaEvaluaciones();
        this.showToast(`Puntos individuales actualizados: ${this.evaluacionActual.estudiante?.nombres} - ${valor} pts`);
      });
      console.log(`Evaluando ${this.evaluacionActual.estudiante.nombres}: ${criterio} = ${valor} puntos`);
    }
  }

  /**
   * Obtiene el valor seleccionado para un criterio
   */
  getCriterioValue(criterio: string): number | null {
    if (this.evaluacionGrupalActiva) {
      return this.evaluacionGrupal.criterios[criterio] || null;
    } else {
      if (!this.evaluacionActual.estudiante) return null;
      return this.evaluacionActual.criterios[criterio] || null;
    }
  }

  /**
   * Abre el modal de comentarios para un criterio
   */
  async abrirComentarios(codigoCriterio: string, nombreCriterio: string): Promise<void> {
    console.log('Abriendo comentarios para:', codigoCriterio, nombreCriterio);

    const comentariosActuales = this.evaluacionGrupalActiva
      ? this.evaluacionGrupal.comentariosCriterios[codigoCriterio] || ''
      : this.evaluacionActual.comentariosCriterios[codigoCriterio] || '';

    const puntajeOriginal = this.evaluacionGrupalActiva
      ? this.evaluacionGrupal.criterios[codigoCriterio] || 0
      : this.evaluacionActual.criterios[codigoCriterio] || 0;

    const ajusteActual = this.evaluacionGrupalActiva
      ? this.evaluacionGrupal.ajustesPuntaje[codigoCriterio] || 0
      : this.evaluacionActual.ajustesPuntaje[codigoCriterio] || 0;

    try {
      const modal = await this.modalController.create({
        component: ComentariosModalComponent,
        componentProps: {
          criterioNombre: nombreCriterio,
          comentarios: comentariosActuales,
          puntajeOriginal: puntajeOriginal,
          ajustePuntaje: ajusteActual,
          comentariosComunes: this.comentariosComunes
        }
      });

      await modal.present();
      console.log('Modal presentado');

      const { data, role } = await modal.onWillDismiss();
      console.log('Modal cerrado con role:', role, 'data:', data);

      if (role === 'confirm' && data !== null) {
        // Guardar como comentario común si se marcó
        if (data.guardarComoComun && data.comentarios.trim()) {
          this.guardarComentarioComun(data.comentarios.trim());
        }

        if (this.evaluacionGrupalActiva) {
          this.evaluacionGrupal.comentariosCriterios[codigoCriterio] = data.comentarios;
          if (data.ajustePuntaje !== undefined) {
            this.evaluacionGrupal.ajustesPuntaje[codigoCriterio] = data.ajustePuntaje;
            // Aplicar el ajuste al puntaje
            const puntajeFinal = puntajeOriginal + data.ajustePuntaje;
            this.evaluacionGrupal.criterios[codigoCriterio] = Math.max(0, puntajeFinal);
          }
          await this.guardarEvaluacionGrupal();
        } else {
          this.evaluacionActual.comentariosCriterios[codigoCriterio] = data.comentarios;
          if (data.ajustePuntaje !== undefined) {
            this.evaluacionActual.ajustesPuntaje[codigoCriterio] = data.ajustePuntaje;
            // Aplicar el ajuste al puntaje
            const puntajeFinal = puntajeOriginal + data.ajustePuntaje;
            this.evaluacionActual.criterios[codigoCriterio] = Math.max(0, puntajeFinal);
          }
          await this.guardarEvaluacionActual();
        }
        this.showToast('Comentario guardado');
      }
    } catch (error) {
      console.error('Error al abrir modal de comentarios:', error);
      this.showAlert('Error', 'No se pudo abrir el modal de comentarios');
    }
  }

  /**
   * Obtiene el rango de puntaje para un nivel
   */
  getRangoNivel(criterio: any, indiceNivel: number): string {
    const niveles = criterio.niveles;
    if (indiceNivel >= niveles.length) return '';

    const nivelActual = niveles[indiceNivel];
    const nivelSiguiente = niveles[indiceNivel + 1];

    if (indiceNivel === 0) {
      // Primer nivel: desde 0 hasta el valor del siguiente nivel menos 1
      const max = nivelSiguiente ? nivelSiguiente.valor - 1 : nivelActual.valor;
      return `(0 - ${max})`;
    } else if (indiceNivel === niveles.length - 1) {
      // Último nivel: desde el valor anterior + 1 hasta el máximo
      const min = niveles[indiceNivel - 1].valor + 1;
      return `(${min} - ${criterio.maxPuntos})`;
    } else {
      // Niveles intermedios: desde valor anterior + 1 hasta valor siguiente - 1
      const min = niveles[indiceNivel - 1].valor + 1;
      const max = nivelSiguiente.valor - 1;
      return `(${min} - ${max})`;
    }
  }

  /**
   * Guarda un comentario común para uso futuro
   */
  guardarComentarioComun(comentario: string): void {
    if (comentario && !this.comentariosComunes.includes(comentario)) {
      this.comentariosComunes.push(comentario);
      // Guardar en localStorage
      localStorage.setItem('comentariosComunes', JSON.stringify(this.comentariosComunes));
      this.showToast('Comentario común guardado');
    }
  }

  /**
   * Carga comentarios comunes desde localStorage
   */
  private cargarComentariosComunes(): void {
    const guardados = localStorage.getItem('comentariosComunes');
    if (guardados) {
      try {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed)) {
          this.comentariosComunes = [...this.comentariosComunes, ...parsed];
        }
      } catch (e) {
        console.error('Error cargando comentarios comunes:', e);
      }
    }
  }

  /**
   * Obtiene los niveles de la rúbrica activa (para encabezado global)
   */
  getNivelesRubrica(): any[] {
    const criterios = this.getCriteriosEntregaActiva();
    if (criterios.length > 0) {
      return criterios[0].niveles; // Todos los criterios comparten los mismos niveles
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
      const valor = criteriosActivos[criterio.codigo];
      if (valor !== undefined) {
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
   * Verifica si un nivel está seleccionado para todos los criterios
   */
  isNivelSelectedForAll(codigoCriterio: string, valorNivel: number): boolean {
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    return criteriosActivos[codigoCriterio] === valorNivel;
  }

  /**
   * Verifica si todos los criterios tienen el mismo nivel seleccionado
   */
  /**
   * Verifica si todos los criterios tienen el nivel en el índice especificado seleccionado
   */
  isTodosCriteriosConNivel(indiceNivel: number): boolean {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      return false;
    }

    const criterios = this.getCriteriosEntregaActiva();
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    // Verificar si todos los criterios tienen el nivel en este índice seleccionado
    return criterios.every((criterio: any) => {
      const valorEsperado = criterio.niveles[indiceNivel]?.valor;
      return criteriosActivos[criterio.codigo] === valorEsperado;
    });
  }

  /**
   * Selecciona el mismo nivel para todos los criterios de la entrega actual
   */
  selectNivelParaTodos(codigoCriterio: string, valorNivel: number): void {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      this.showToast('Seleccione un estudiante o active la evaluación grupal primero');
      return;
    }

    const criterios = this.getCriteriosEntregaActiva();

    if (this.evaluacionGrupalActiva) {
      // Aplicar a todos los criterios en evaluación grupal
      criterios.forEach((criterio: any) => {
        this.evaluacionGrupal.criterios[criterio.codigo] = valorNivel;
      });
      this.guardarEvaluacionGrupal();
    } else {
      // Aplicar a todos los criterios en evaluación individual
      criterios.forEach((criterio: any) => {
        this.evaluacionActual.criterios[criterio.codigo] = valorNivel;
      });
      this.guardarEvaluacionActual();
    }

    this.showToast('Nivel aplicado a todos los criterios');
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

    // Verificar si todos los criterios tienen el nivel en este índice seleccionado
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    const todosTienenEsteNivel = criterios.every((criterio: any) => {
      const valorEsperado = criterio.niveles[indiceNivel]?.valor;
      return criteriosActivos[criterio.codigo] === valorEsperado;
    });

    if (this.evaluacionGrupalActiva) {
      if (todosTienenEsteNivel) {
        // Deseleccionar: limpiar todos los criterios
        criterios.forEach((criterio: any) => {
          delete this.evaluacionGrupal.criterios[criterio.codigo];
        });
        this.showToast('Nivel deseleccionado para todos los criterios');
      } else {
        // Seleccionar: aplicar el valor del nivel en este índice para cada criterio
        criterios.forEach((criterio: any) => {
          const valorNivel = criterio.niveles[indiceNivel]?.valor;
          if (valorNivel !== undefined) {
            this.evaluacionGrupal.criterios[criterio.codigo] = valorNivel;
          }
        });
        this.showToast('Nivel aplicado a todos los criterios');
      }
      this.guardarEvaluacionGrupal();
    } else {
      if (todosTienenEsteNivel) {
        // Deseleccionar: limpiar todos los criterios
        criterios.forEach((criterio: any) => {
          delete this.evaluacionActual.criterios[criterio.codigo];
        });
        this.showToast('Nivel deseleccionado para todos los criterios');
      } else {
        // Seleccionar: aplicar el valor del nivel en este índice para cada criterio
        criterios.forEach((criterio: any) => {
          const valorNivel = criterio.niveles[indiceNivel]?.valor;
          if (valorNivel !== undefined) {
            this.evaluacionActual.criterios[criterio.codigo] = valorNivel;
          }
        });
        this.showToast('Nivel aplicado a todos los criterios');
      }
      this.guardarEvaluacionActual();
    }
  }

  /**
   * Inicia la evaluación individual de un estudiante
   */
  iniciarEvaluacion(estudiante: Estudiante): void {
    // Desactivar evaluación grupal y limpiar subgrupo seleccionado
    this.evaluacionGrupalActiva = false;
    this.subgrupoSeleccionado = '';
    this.limpiarEvaluacionGrupal();

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
   * Inicia la evaluación grupal
   */
  iniciarEvaluacionGrupal(subgrupo: string): void {
    const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);
    if (estudiantesGrupo.length > 0) {
      // Resetear evaluacionActual
      this.evaluacionActual = {
        estudiante: estudiantesGrupo[0], // Primer estudiante como representante
        entrega: this.entregaActiva,
        criterios: {},
        comentariosCriterios: {},
        ajustesPuntaje: {},
        comentarios: '',
        fecha: new Date().toISOString(),
        esGrupal: true
      };

      // Resetear evaluacionGrupal antes de cargar
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
    }
  }

  /**
   * Carga una evaluación grupal existente
   */
  private async cargarEvaluacionGrupalExistente(subgrupo: string, entrega: string): Promise<void> {
    try {
      // Buscar evaluación grupal existente
      const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);
      if (estudiantesGrupo.length > 0) {
        const evaluacionExistente = this.getEvaluacion(estudiantesGrupo[0].correo, entrega);
        if (evaluacionExistente && evaluacionExistente.grup_eval) {
          // Cargar criterios existentes en la evaluación grupal
          const criteriosGuardados = evaluacionExistente.grup_eval.criterios || [];
          const criteriosActivos = this.getCriteriosEntregaActiva();

          criteriosGuardados.forEach((criterio: any) => {
            // Buscar el criterio correspondiente por nombre para obtener su código
            const criterioConfig = criteriosActivos.find((c: any) => c.nombre === criterio.nombre);
            if (criterioConfig) {
              this.evaluacionGrupal.criterios[criterioConfig.codigo] = criterio.points;
            }
          });

          // Cargar comentarios generales
          this.evaluacionGrupal.comentarios = evaluacionExistente.grup_eval.comentarios || '';

          // Cargar comentarios por criterio si existen
          if ((evaluacionExistente.grup_eval as any).comentariosCriterios) {
            this.evaluacionGrupal.comentariosCriterios = (evaluacionExistente.grup_eval as any).comentariosCriterios;
          }

          console.log('Evaluación grupal cargada:', this.evaluacionGrupal.criterios);
        }
      }
    } catch (error) {
      console.error('Error cargando evaluación grupal existente:', error);
    }
  }

  /**
   * Carga una evaluación existente
   */
  private async cargarEvaluacionExistente(estudiante: Estudiante, entrega: string): Promise<void> {
    try {
      const evaluacionExistente = this.getEvaluacion(estudiante.correo, entrega);
      if (evaluacionExistente && evaluacionExistente.ind_eval) {
        // Cargar criterios existentes
        const criteriosGuardados = evaluacionExistente.ind_eval.criterios || [];
        const criteriosActivos = this.getCriteriosEntregaActiva();

        // Si es un array (formato nuevo)
        if (Array.isArray(criteriosGuardados)) {
          criteriosGuardados.forEach((criterio: any) => {
            // Buscar el criterio correspondiente por nombre para obtener su código
            const criterioConfig = criteriosActivos.find((c: any) => c.nombre === criterio.nombre);
            if (criterioConfig) {
              this.evaluacionActual.criterios[criterioConfig.codigo] = criterio.points;
            }
          });
        } else {
          // Si es un objeto (formato antiguo)
          Object.keys(criteriosGuardados).forEach(criterio => {
            this.evaluacionActual.criterios[criterio] = (criteriosGuardados as any)[criterio];
          });
        }

        // Cargar comentarios generales
        this.evaluacionActual.comentarios = evaluacionExistente.ind_eval.comentarios || '';

        // Cargar comentarios por criterio si existen
        if ((evaluacionExistente.ind_eval as any).comentariosCriterios) {
          this.evaluacionActual.comentariosCriterios = (evaluacionExistente.ind_eval as any).comentariosCriterios;
        }

        console.log('Evaluación individual cargada:', this.evaluacionActual.criterios);
      }
    } catch (error) {
      console.error('Error cargando evaluación existente:', error);
    }
  }

  /**
   * Guarda la evaluación actual
   */
  private async guardarEvaluacionActual(): Promise<void> {
    if (!this.evaluacionActual.estudiante || !this.curso) return;

    try {
      // Convertir criterios a formato del modelo
      const criteriosArray = this.getCriteriosEntregaActiva().map((criterioConfig: any) => {
        const valorSeleccionado = this.evaluacionActual.criterios[criterioConfig.codigo];
        const nivelSeleccionado = criterioConfig.niveles.find((n: any) => n.valor === valorSeleccionado);

        return {
          nombre: criterioConfig.nombre,
          descripcion: criterioConfig.peso,
          selectedLevel: nivelSeleccionado?.valor || 0,
          points: valorSeleccionado || 0,
          niveles: criterioConfig.niveles.map((nivel: any) => ({
            nivel: nivel.valor,
            descripcion: nivel.descripcion,
            puntos: nivel.valor
          }))
        };
      });

      const totalScore = this.calcularTotalEvaluacion();

      const evaluacionCompleta: Evaluacion = {
        correo: this.evaluacionActual.estudiante.correo,
        ind_eval: {
          criterios: criteriosArray,
          totalScore: totalScore,
          comentarios: this.evaluacionActual.comentarios,
          fecha: this.evaluacionActual.fecha,
          comentariosCriterios: this.evaluacionActual.comentariosCriterios
        } as any,
        pi_score: totalScore, // Puntuación individual
        sumatoria: totalScore
      };

      // Guardar en el curso
      if (!this.curso.evaluaciones) {
        this.curso.evaluaciones = { E1: {}, E2: {}, EF: {} };
      }

      if (!this.curso.evaluaciones[this.evaluacionActual.entrega as keyof typeof this.curso.evaluaciones]) {
        this.curso.evaluaciones[this.evaluacionActual.entrega as keyof typeof this.curso.evaluaciones] = {};
      }

      const entregaEvals = this.curso.evaluaciones[this.evaluacionActual.entrega as keyof typeof this.curso.evaluaciones];
      if (entregaEvals) {
        // Obtener evaluación existente para preservar puntuación grupal si existe
        const evaluacionExistente = entregaEvals[this.evaluacionActual.estudiante.correo];

        // Actualizar con puntuación grupal existente si la hay
        if (evaluacionExistente?.pg_score) {
          evaluacionCompleta.pg_score = evaluacionExistente.pg_score;
          evaluacionCompleta.sumatoria = totalScore + evaluacionExistente.pg_score;
        }

        entregaEvals[this.evaluacionActual.estudiante.correo] = evaluacionCompleta;
      }

      // Guardar en la base de datos
      await this.databaseService.saveCurso(this.curso.id, this.curso);

      console.log('Evaluación guardada exitosamente');
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      this.showAlert('Error', 'No se pudo guardar la evaluación');
    }
  }

  /**
   * Guarda la evaluación grupal
   */
  private async guardarEvaluacionGrupal(): Promise<void> {
    if (!this.evaluacionGrupal.subgrupo || !this.curso) return;

    try {
      // Convertir criterios a formato del modelo
      const criteriosArray = this.getCriteriosEntregaActiva().map((criterioConfig: any) => {
        const valorSeleccionado = this.evaluacionGrupal.criterios[criterioConfig.codigo];
        const nivelSeleccionado = criterioConfig.niveles.find((n: any) => n.valor === valorSeleccionado);

        return {
          nombre: criterioConfig.nombre,
          descripcion: criterioConfig.peso,
          selectedLevel: nivelSeleccionado?.valor || 0,
          points: valorSeleccionado || 0,
          niveles: criterioConfig.niveles.map((nivel: any) => ({
            nivel: nivel.valor,
            descripcion: nivel.descripcion,
            puntos: nivel.valor
          }))
        };
      });

      // Obtener estudiantes del subgrupo para aplicar la evaluación grupal
      const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === this.evaluacionGrupal.subgrupo);

      // Guardar en el curso para todos los estudiantes del grupo
      if (!this.curso.evaluaciones) {
        this.curso.evaluaciones = { E1: {}, E2: {}, EF: {} };
      }

      if (!this.curso.evaluaciones[this.evaluacionGrupal.entrega as keyof typeof this.curso.evaluaciones]) {
        this.curso.evaluaciones[this.evaluacionGrupal.entrega as keyof typeof this.curso.evaluaciones] = {};
      }

      const entregaEvals = this.curso.evaluaciones[this.evaluacionGrupal.entrega as keyof typeof this.curso.evaluaciones];

      const totalScore = this.calcularTotalEvaluacion();

      if (entregaEvals) {
        estudiantesGrupo.forEach(estudiante => {
          // Obtener evaluación existente para preservar puntuación individual si existe
          const evaluacionExistente = entregaEvals[estudiante.correo];

          const evaluacionCompleta: Evaluacion = {
            correo: estudiante.correo,
            grup_eval: {
              criterios: criteriosArray,
              totalScore: totalScore,
              comentarios: this.evaluacionGrupal.comentarios,
              fecha: this.evaluacionGrupal.fecha,
              comentariosCriterios: this.evaluacionGrupal.comentariosCriterios
            } as any,
            pg_score: totalScore, // Puntuación grupal
            pi_score: evaluacionExistente?.pi_score, // Preservar puntuación individual si existe
            sumatoria: (totalScore + (evaluacionExistente?.pi_score || 0))
          };

          entregaEvals[estudiante.correo] = evaluacionCompleta;
        });
      }

      // Guardar en la base de datos
      await this.databaseService.saveCurso(this.curso.id, this.curso);

      // Mostrar resumen después de guardar
      this.mostrarResumen = true;

      console.log(`Evaluación grupal guardada para ${this.evaluacionGrupal.subgrupo}`);
    } catch (error) {
      console.error('Error guardando evaluación grupal:', error);
      this.showAlert('Error', 'No se pudo guardar la evaluación grupal');
    }
  }

  /**
   * Actualiza los comentarios de la evaluación
   */
  actualizarComentarios(comentarios: string): void {
    if (this.evaluacionGrupalActiva) {
      this.evaluacionGrupal.comentarios = comentarios;
      this.guardarEvaluacionGrupal();
    } else {
      this.evaluacionActual.comentarios = comentarios;
      this.guardarEvaluacionActual();
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
    if (porcentaje === 0) return '';
    if (porcentaje < 40) return 'Malo';
    if (porcentaje < 60) return 'Deficiente';
    if (porcentaje < 75) return 'Aceptable';
    if (porcentaje < 90) return 'Bueno';
    return 'Excelente';
  }

  /**
   * Obtiene la clase CSS para el badge de progreso según rendimiento
   */
  getClaseRendimiento(): string {
    const porcentaje = this.getPorcentajeCompletitud();
    if (porcentaje === 0) return '';
    if (porcentaje < 40) return 'malo';
    if (porcentaje < 60) return 'deficiente';
    if (porcentaje < 75) return 'aceptable';
    if (porcentaje < 90) return 'bueno';
    return 'excelente';
  }

  /**
   * Verifica si la evaluación está completa
   */
  isEvaluacionCompleta(): boolean {
    const criterios = this.getCriteriosEntregaActiva();
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    return criterios.every((criterio: any) =>
      criteriosActivos[criterio.codigo] !== undefined
    );
  }

  /**
   * Finaliza la evaluación actual
   */
  async finalizarEvaluacion(): Promise<void> {
    if (!this.isEvaluacionCompleta()) {
      this.showAlert('Evaluación incompleta', 'Debe evaluar todos los criterios antes de finalizar.');
      return;
    }

    try {
      // Guardar evaluación final
      if (this.evaluacionGrupalActiva) {
        await this.guardarEvaluacionGrupal();
      } else {
        await this.guardarEvaluacionActual();
      }

      // Mostrar resumen
      const total = this.calcularTotalEvaluacion();
      const maximo = this.getMaximoPuntaje();
      const porcentaje = Math.round((total / maximo) * 100);

      if (this.evaluacionGrupalActiva) {
        const subgrupoActual = this.evaluacionGrupal.subgrupo;

        this.showAlert(
          'Evaluación completada',
          `Evaluación grupal de ${subgrupoActual} finalizada.\n` +
          `Puntuación: ${total}/${maximo} puntos (${porcentaje}%)`
        );

        // Limpiar solo criterios y comentarios, mantener grupo seleccionado
        this.evaluacionGrupal.criterios = {};
        this.evaluacionGrupal.comentariosCriterios = {};
        this.evaluacionGrupal.ajustesPuntaje = {};
        this.evaluacionGrupal.comentarios = '';
        this.evaluacionGrupal.fecha = new Date().toISOString();
        // Mantener: evaluacionGrupalActiva, subgrupoSeleccionado, evaluacionGrupal.subgrupo
      } else {
        const estudianteActual = this.evaluacionActual.estudiante;

        this.showAlert(
          'Evaluación completada',
          `Evaluación de ${estudianteActual?.nombres} finalizada.\n` +
          `Puntuación: ${total}/${maximo} puntos (${porcentaje}%)`
        );

        // Limpiar solo criterios y comentarios, mantener estudiante seleccionado
        this.evaluacionActual.criterios = {};
        this.evaluacionActual.comentariosCriterios = {};
        this.evaluacionActual.ajustesPuntaje = {};
        this.evaluacionActual.comentarios = '';
        this.evaluacionActual.fecha = new Date().toISOString();
        // Mantener: evaluacionActual.estudiante
      }

    } catch (error) {
      console.error('Error finalizando evaluación:', error);
      this.showAlert('Error', 'No se pudo finalizar la evaluación.');
    }
  }

  /**
   * Obtiene los criterios de la entrega activa
   */
  getCriteriosEntregaActiva() {
    // Si hay evaluación grupal activa, mostrar rúbrica grupal
    if (this.evaluacionGrupalActiva && this.subgrupoSeleccionado && this.subgrupoSeleccionado !== '') {
      const entrega = this.entregaActiva as 'E1' | 'E2' | 'EF';
      return this.rubricasGrupales[entrega] || this.rubricasGrupales['E1'];
    } else {
      return this.rubricaIndividual;
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
   */
  async abrirMenuContexto(estudiante: Estudiante, event: any): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: `${estudiante.nombres} ${estudiante.apellidos}`,
      subHeader: estudiante.correo,
      buttons: [
        {
          text: 'Editar E1',
          handler: () => this.abrirEditorPuntos(estudiante, 'E1')
        },
        {
          text: 'Editar E2',
          handler: () => this.abrirEditorPuntos(estudiante, 'E2')
        },
        {
          text: 'Editar EF',
          handler: () => this.abrirEditorPuntos(estudiante, 'EF')
        },
        {
          text: 'Eliminar estudiante',
          role: 'destructive',
          handler: () => this.confirmarEliminacion(estudiante)
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  /**
   * Abre un editor para modificar puntos de forma inline
   */
  async abrirEditorPuntos(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF'): Promise<void> {
    const evaluacion = this.getEvaluacion(estudiante.correo, entrega);
    const pgScore = evaluacion?.pg_score || '';
    const piScore = evaluacion?.pi_score || '';

    const alert = await this.alertController.create({
      header: `Editar ${entrega} - ${estudiante.nombres} ${estudiante.apellidos}`,
      inputs: [
        {
          name: 'pg_score',
          type: 'number',
          placeholder: 'PG (Puntos Grupal)',
          value: pgScore,
          min: '0',
          max: '100'
        },
        {
          name: 'pi_score',
          type: 'number',
          placeholder: 'PI (Puntos Individual)',
          value: piScore,
          min: '0',
          max: '100'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            await this.guardarPuntosEditados(estudiante, entrega, data);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Guarda los puntos editados
   */
  private async guardarPuntosEditados(estudiante: Estudiante, entrega: 'E1' | 'E2' | 'EF', data: any): Promise<void> {
    try {
      const pgScore = parseFloat(data.pg_score) || 0;
      const piScore = parseFloat(data.pi_score) || 0;
      const sumatoria = pgScore + piScore;

      // Actualizar la evaluación en el servicio
      const evaluacion: any = {
        entrega,
        pg_score: pgScore,
        pi_score: piScore,
        sumatoria: sumatoria,
        comentarios: ''
      };

      // Guardar en la base de datos
      if (this.curso) {
        await this.databaseService.saveEvaluacion(
          `${this.cursoId}_${estudiante.correo}_${entrega}`,
          this.cursoId,
          estudiante.correo,
          { [entrega]: evaluacion }
        );

        await this.showToast(`Puntos de ${entrega} guardados correctamente`);
        await this.loadCurso();
      }
    } catch (error) {
      console.error('Error al guardar puntos:', error);
      await this.showAlert('Error', 'No se pudieron guardar los puntos');
    }
  }

  /**
   * Confirma la eliminación de un estudiante del curso
   */
  private async confirmarEliminacion(estudiante: Estudiante): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${estudiante.nombres} ${estudiante.apellidos} de este curso?`,
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
        await this.databaseService.saveCurso(this.cursoId, this.curso);

        await this.showToast(`${estudiante.nombres} ${estudiante.apellidos} ha sido eliminado del curso`, 'success');
      }
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      await this.showAlert('Error', 'No se pudo eliminar el estudiante');
    }
  }

  /**
   * Obtiene el resumen completo de la rúbrica para la entrega activa
   */
  getResumenRubrica(): any[] {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      return [];
    }

    const criterios = this.getCriteriosEntregaActiva();
    const criteriosActivos = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.criterios :
      this.evaluacionActual.criterios;

    const comentariosCriterios = this.evaluacionGrupalActiva ?
      this.evaluacionGrupal.comentariosCriterios :
      this.evaluacionActual.comentariosCriterios;

    return criterios.map((criterio: any) => {
      const valorSeleccionado = criteriosActivos[criterio.codigo];
      const nivelSeleccionado = criterio.niveles.find((n: any) => n.valor === valorSeleccionado);
      const comentario = comentariosCriterios[criterio.codigo] || '';

      // Construir información de niveles y rangos
      const nivelesInfo = criterio.niveles.map((nivel: any) => nivel.nombre).join(' | ');

      return {
        nombre: criterio.nombre,
        peso: criterio.peso,
        nivelesInfo: nivelesInfo,
        nivelSeleccionado: nivelSeleccionado?.nombre || 'No evaluado',
        descripcion: nivelSeleccionado?.descripcion || '',
        puntos: valorSeleccionado || 0,
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

    return !!comentarios[codigoCriterio];
  }

  /**
   * Obtiene el rendimiento de una entrega específica
   */
  getRendimientoEntrega(entrega: string): string {
    if (!this.evaluacionActual.estudiante && !this.evaluacionGrupalActiva) {
      return 'Sin evaluación';
    }

    const estudiante = this.evaluacionActual.estudiante;
    const subgrupo = this.evaluacionGrupal.subgrupo;

    if (this.evaluacionGrupalActiva && subgrupo) {
      // Obtener evaluación grupal del primer estudiante del grupo
      const estudiantesGrupo = this.estudiantes.filter(est => est.subgrupo === subgrupo);
      if (estudiantesGrupo.length > 0) {
        const evaluacion = this.getEvaluacion(estudiantesGrupo[0].correo, entrega);
        if (evaluacion) {
          const total = evaluacion.sumatoria || 0;
          const maximo = entrega === 'EF' ? 100 : 75; // EF tiene 100 puntos, E1 y E2 tienen 75
          const porcentaje = Math.round((total / maximo) * 100);
          return `${total}/${maximo} pts (${porcentaje}%) - ${this.getTextoRendimientoPorPorcentaje(porcentaje)}`;
        }
      }
    } else if (estudiante) {
      const evaluacion = this.getEvaluacion(estudiante.correo, entrega);
      if (evaluacion) {
        const total = evaluacion.sumatoria || 0;
        const maximo = entrega === 'EF' ? 100 : 75; // EF tiene 100 puntos, E1 y E2 tienen 75
        const porcentaje = Math.round((total / maximo) * 100);
        return `${total}/${maximo} pts (${porcentaje}%) - ${this.getTextoRendimientoPorPorcentaje(porcentaje)}`;
      }
    }

    const maximoDefault = entrega === 'EF' ? 100 : 75;
    return `0/${maximoDefault} pts (0%) - Sin evaluar`;
  }

  /**
   * Obtiene el texto de rendimiento según un porcentaje dado
   */
  private getTextoRendimientoPorPorcentaje(porcentaje: number): string {
    if (porcentaje === 0) return 'Sin evaluar';
    if (porcentaje < 40) return 'Malo';
    if (porcentaje < 60) return 'Deficiente';
    if (porcentaje < 75) return 'Aceptable';
    if (porcentaje < 90) return 'Bueno';
    return 'Excelente';
  }
}
