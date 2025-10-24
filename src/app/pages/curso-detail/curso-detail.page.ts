import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-curso-detail',
  templateUrl: './curso-detail.page.html',
  styleUrls: ['./curso-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CursoDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  curso: any = null;
  isLoading = false;
  showSeguimiento = false;
  entregaActiva: 'E1' | 'E2' | 'EF' = 'E1';
  entregas = ['E1', 'E2', 'EF'];
  subgrupos: string[] = [];
  subgrupoFilter: string | null = null;
  searchText = '';
  estudiantesFiltrados: any[] = [];
  evaluacionActual: any = { estudiante: null, comentarios: '' };
  evaluacionGrupal: any = { subgrupo: '', comentarios: '' };
  evaluacionGrupalActiva = false;
  mostrarResumen = false;
  selectAll = false;
  subgrupoSeleccionado = '';
  selectedEstudiantes: string[] = [];

  get comentariosActuales(): string {
    return this.evaluacionGrupalActiva ? this.evaluacionGrupal.comentarios : this.evaluacionActual.comentarios;
  }

  set comentariosActuales(value: string) {
    if (this.evaluacionGrupalActiva) {
      this.evaluacionGrupal.comentarios = value;
    } else {
      this.evaluacionActual.comentarios = value;
    }
  }

  criterios = [
    {
      codigo: 'conocimiento_tecnico',
      nombre: 'Conocimiento Técnico',
      peso: 15,
      maxPuntos: 15,
      niveles: [
        { valor: 4, nombre: 'Insuficiente (0-4)', descripcion: 'Conocimiento técnico insuficiente.' },
        { valor: 8, nombre: 'Básico (5-8)', descripcion: 'Conocimiento técnico básico.' },
        { valor: 12, nombre: 'Bueno (9-12)', descripcion: 'Conocimiento técnico bueno.' },
        { valor: 15, nombre: 'Excelente (13-15)', descripcion: 'Conocimiento técnico excelente.' }
      ]
    }
  ];

  ngOnInit() {
    // Inicialización
  }

  goBack() {
    this.router.navigate(['/']);
  }

  toggleSeguimiento() {
    this.showSeguimiento = !this.showSeguimiento;
  }

  onEntregaChange(_event?: any) {
    // Manejar cambio de entrega
  }

  onSearchChange(_event: any) {
    // Manejar cambio de búsqueda
  }

  onSubgrupoChange(_event: any) {
    // Manejar cambio de subgrupo
  }

  clearFilters() {
    this.subgrupoFilter = null;
    this.searchText = '';
  }

  toggleSelectAll(_event: any) {
    this.selectAll = !this.selectAll;
  }

  iniciarEvaluacion(_estudiante: any) {
    // Iniciar evaluación de estudiante
  }

  isSelected(_correo: string) {
    return this.selectedEstudiantes.includes(_correo);
  }

  toggleSelectEstudiante(_correo: string) {
    const index = this.selectedEstudiantes.indexOf(_correo);
    if (index > -1) {
      this.selectedEstudiantes.splice(index, 1);
    } else {
      this.selectedEstudiantes.push(_correo);
    }
  }

  isPuntosActualizados(_correo: string) {
    return false;
  }

  abrirEditorPuntos(_estudiante: any, _entrega: string) {
    // Abrir editor de puntos
  }

  getEvaluacion(_correo: string, _entrega: string) {
    return { puntajeGrupal: 0, puntajeIndividual: 0, pg_score: 0, pi_score: 0 };
  }

  confirmEliminacion(_estudiante: any) {
    // Confirmar eliminación
  }

  seleccionarSubgrupo(_subgrupo: string) {
    this.subgrupoSeleccionado = _subgrupo;
  }

  cancelarEvaluacion() {
    this.evaluacionActual = { estudiante: null, comentarios: '' };
    this.evaluacionGrupalActiva = false;
  }

  calcularTotalEvaluacion() {
    return 0;
  }

  getMaximoPuntaje() {
    return this.criterios.reduce((sum, c) => sum + c.maxPuntos, 0);
  }

  actualizarComentarios() {
    // Actualizar comentarios
  }

  getCriteriosEntregaActiva() {
    return this.criterios;
  }

  abrirComentarios(_codigo: string, _nombre: string) {
    // Abrir comentarios
  }

  isNivelSelectedForCriterio(_codigo: string, _valor: number) {
    return false;
  }

  selectNivel(_codigo: string, _valor: number) {
    // Seleccionar nivel
  }

  getSubgruposOrdenados() {
    return this.subgrupos.sort();
  }

  getCriteriosEntrega() {
    return this.criterios;
  }

  tieneComentarioCriterio(_codigo: string) {
    return false;
  }

  getAjustePuntaje(_codigo: string) {
    return 0;
  }

  getComentarioCriterio(_codigo: string) {
    return '';
  }
}
