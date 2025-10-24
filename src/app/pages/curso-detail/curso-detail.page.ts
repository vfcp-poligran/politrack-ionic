import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonContent,
  IonSpinner,
  IonList,
  IonItemDivider,
  IonCheckbox,
  IonTextarea,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonText
} from '@ionic/angular/standalone';
import { TipoEntrega, ENTREGA_LABELS } from '../../core/models/entrega.model';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from '../../core/services/database.service';
import { Estudiante } from '../../core/models/estudiante.model';
import { Curso } from '../../core/models/curso.model';
import { Evaluacion, NivelCriterio } from '../../core/models/evaluacion.model';

interface EvaluacionEstudiante {
  estudiante?: Estudiante;
  criterios?: any[];
  criteriosSeleccionados?: { [criterioCodigo: string]: number };
  ajustesPuntaje?: { [criterioCodigo: string]: number };
  comentariosCriterios?: { [criterioCodigo: string]: string };
  puntajeTotal?: number;
  comentarios?: string;
  subgrupo?: string;
}

@Component({
  selector:'app-curso-detail',
  templateUrl:'./curso-detail.page.html',
  styleUrls:['./curso-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonContent,
    IonSpinner,
    IonList,
    IonItemDivider,
    IonCheckbox,
    IonTextarea,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel
  ]
})
export class CursoDetailPage implements OnInit {
  // Services injection using inject() function
  private route = inject(ActivatedRoute);
  private databaseService = inject(DatabaseService);
  private locationService = inject(Location);

  entregas: string[] = [];
  entregaActiva: TipoEntrega = TipoEntrega.E1;
  curso: Curso | null = null;
  showSeguimiento: boolean = false;
  mostrarResumen: boolean = false;

  estudiantes: Estudiante[] = [];
  searchText: string = '';
  subgrupoFilter: string = '';

  // Getter para estudiantesFiltrados
  public get estudiantesFiltrados(): Estudiante[] {
    let filtrados = this.estudiantes;

    if (this.searchText) {
      const texto = this.searchText.toLowerCase();
      filtrados = filtrados.filter(e =>
        (e.nombres + ' ' + e.apellidos).toLowerCase().includes(texto) ||
        e.correo.toLowerCase().includes(texto)
      );
    }

    if (this.subgrupoFilter) {
      filtrados = filtrados.filter(e => e.subgrupo === this.subgrupoFilter);
    }

    return filtrados;
  }

  isLoading: boolean = false;

  // Añadido para checkbox "Seleccionar todos"
  public selectAll: boolean = false;

  // Evaluación actual con tipos adecuados
  public evaluacionActual: EvaluacionEstudiante = {} as EvaluacionEstudiante;

  // Arrays para correos seleccionados
  selectedEstudiantes: string[] = [];
  estudiantesSeleccionados: string[] = [];

  // Lista de correos cuyos puntos han sido actualizados recientemente
  puntosActualizados: string[] = [];

  // Evaluaciones indexadas por correo y entrega
  evaluaciones: { [correo: string]: { [entrega: string]: Evaluacion } } = {};

  // Subgrupos disponibles
  subgrupos: string[] = [];
  subgrupoSeleccionado: string = '';

  // Comentarios
  public comentariosActuales: string = '';
  public comentariosCriterios: { [codigo: string]: string } = {};

  // Propiedad para almacenar el criterio seleccionado para comentarios
  criterioSeleccionado: { codigo: string, nombre: string } | null = null;

  // Propiedad para controlar la visibilidad del modal de comentarios
  mostrarModalComentario: boolean = false;

  async ngOnInit() {
    // Obtener ID del curso desde la ruta
    const cursoId = this.route.snapshot.paramMap.get('id');
    if (cursoId) {
      await this.loadCurso(cursoId);
    }
  }

  private async loadCurso(cursoId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.curso = await this.databaseService.getCursoById(cursoId);
      if (this.curso) {
        this.estudiantes = await this.databaseService.getEstudiantesByCursoId(cursoId);
        this.evaluaciones = await this.databaseService.getEvaluacionesCurso(cursoId);
        this.extractSubgrupos();
      }
    } catch (error) {
      console.error('Error loading curso:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private extractSubgrupos(): void {
    const subgruposSet = new Set<string>();
    this.estudiantes.forEach(est => {
      if (est.subgrupo) {
        subgruposSet.add(est.subgrupo);
      }
    });
    this.subgrupos = Array.from(subgruposSet);
  }

  getLabel(entrega: TipoEntrega): string {
    return ENTREGA_LABELS[entrega];
  }

  public goBack(): void {
    this.locationService.back();
  }

  get TipoEntrega() {
    return TipoEntrega;
  }

  public toggleSeguimiento(): void {
    this.showSeguimiento = !this.showSeguimiento;
  }

  onEntregaChange(event: CustomEvent): void {
    this.entregaActiva = event.detail?.value || this.entregaActiva;
  }

  onSearchChange(event: CustomEvent): void {
    const value = event?.detail?.value || '';
    this.searchText = value;
    this.filtrarEstudiantes();
  }

  filtrarEstudiantes() {
    // Filtering is handled by getter
  }

  getSubgruposOrdenados(): string[] {
    return this.subgrupos ? [...this.subgrupos].sort((a, b) => a.localeCompare(b)) : [];
  }

  public clearFilters(): void {
    this.subgrupoFilter = '';
    this.searchText = '';
  }

  public toggleSelectAll(event: CustomEvent): void {
    this.selectAll = event.detail.checked;
    if (this.selectAll) {
      this.selectedEstudiantes = this.estudiantesFiltrados.map(est => est.correo);
    } else {
      this.selectedEstudiantes = [];
    }
  }

  iniciarEvaluacion(estudiante: Estudiante): void {
    this.evaluacionActual = {
      ...this.evaluacionActual,
      estudiante: estudiante
    };
  }

  isSelected(correo: string): boolean {
    return this.selectedEstudiantes.includes(correo);
  }

  toggleSelectEstudiante(correo: string): void {
    const idx = this.estudiantesSeleccionados.indexOf(correo);
    if (idx > -1) {
      this.estudiantesSeleccionados.splice(idx, 1);
    } else {
      this.estudiantesSeleccionados.push(correo);
    }
  }

  isPuntosActualizados(correo: string): boolean {
    return this.puntosActualizados?.includes(correo) ?? false;
  }

  public getEvaluacion(correo: string, entrega: string): Evaluacion | undefined {
    if (!this.evaluaciones || !correo || !entrega) {
      return undefined;
    }
    if (this.evaluaciones[correo] && this.evaluaciones[correo][entrega]) {
      return this.evaluaciones[correo][entrega];
    }
    return undefined;
  }

  eliminarEstudiante(estudiante: Estudiante): void {
    console.log(`Funcionalidad de eliminar estudiante: ${estudiante.nombres} ${estudiante.apellidos}`);
  }

  seleccionarSubgrupo(subgrupo: string) {
    this.subgrupoSeleccionado = subgrupo;
  }

  actualizarComentarios() {
    // Placeholder
  }

  public calcularTotalEvaluacion(): number {
    if (!this.evaluacionActual || !this.evaluacionActual.criterios) {
      return 0;
    }
    return this.evaluacionActual.criterios.reduce((total: number, criterio: any) => {
      const nivel = criterio.nivelSeleccionado ? criterio.nivelSeleccionado.valor : 0;
      const ajuste = criterio.ajustePuntaje || 0;
      return total + nivel + ajuste;
    }, 0);
  }

  public getMaximoPuntaje(): number {
    const criterios = this.getCriteriosEntregaActiva();
    let total = 0;
    for (const criterio of criterios) {
      if (criterio.niveles && criterio.niveles.length > 0) {
        const maxNivel: number = Math.max(...criterio.niveles.map((n: NivelCriterio) => n.valor));
        total += (maxNivel * (criterio.peso || 1));
      }
    }
    return total;
  }

  public getCriteriosEntregaActiva(): any[] {
    if (this.evaluacionActual && this.evaluacionActual.criterios) {
      return this.evaluacionActual.criterios;
    }
    return [];
  }

  public tieneComentarioCriterio(criterioCodigo: string): boolean {
    if (!this.evaluacionActual || !this.evaluacionActual.comentariosCriterios) {
      return false;
    }
    const comentario = this.evaluacionActual.comentariosCriterios[criterioCodigo];
    return !!(comentario && comentario.trim().length > 0);
  }

  abrirComentarios(codigoCriterio: string, nombreCriterio: string): void {
    this.criterioSeleccionado = { codigo: codigoCriterio, nombre: nombreCriterio };
    this.mostrarModalComentario = true;
  }

  isNivelSelectedForCriterio(criterioCodigo: string, nivelValor: number): boolean {
    if (!this.evaluacionActual || !this.evaluacionActual.criteriosSeleccionados) {
      return false;
    }
    return this.evaluacionActual.criteriosSeleccionados[criterioCodigo] === nivelValor;
  }

  public selectNivel(criterioCodigo: string, nivelValor: number): void {
    if (!this.evaluacionActual.criteriosSeleccionados) {
      this.evaluacionActual.criteriosSeleccionados = {};
    }
    this.evaluacionActual.criteriosSeleccionados[criterioCodigo] = nivelValor;
    this.guardarEvaluacion();
  }

  async guardarEvaluacion(): Promise<void> {
    console.log('Evaluación guardada:', this.evaluacionActual);
  }

  getAjustePuntaje(criterioCodigo: string): number {
    if (
      this.evaluacionActual &&
      this.evaluacionActual.ajustesPuntaje &&
      typeof this.evaluacionActual.ajustesPuntaje[criterioCodigo] === 'number'
    ) {
      return this.evaluacionActual.ajustesPuntaje[criterioCodigo];
    }
    return 0;
  }

  public getComentarioCriterio(codigoCriterio: string): string {
    return this.comentariosCriterios && this.comentariosCriterios[codigoCriterio]
      ? this.comentariosCriterios[codigoCriterio]
      : '';
  }
}
