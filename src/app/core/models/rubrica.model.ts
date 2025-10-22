/**
 * Modelo de Rúbrica
 */
export interface Rubrica {
  id: string;
  nombre: string;
  descripcion?: string;
  criterios: CriterioRubrica[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Criterio de una rúbrica
 */
export interface CriterioRubrica {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
  niveles: NivelRubrica[];
}

/**
 * Nivel de desempeño en un criterio
 */
export interface NivelRubrica {
  nivel: number;
  descripcion: string;
  puntos: number;
}

/**
 * Plantilla de rúbrica predefinida
 */
export interface RubricaTemplate {
  nombre: string;
  descripcion: string;
  criterios: Omit<CriterioRubrica, 'id'>[];
}

/**
 * Comentario predefinido para evaluaciones
 */
export interface ComentarioPredefinido {
  id: string;
  texto: string;
  categoria?: string;
  orden?: number;
}
