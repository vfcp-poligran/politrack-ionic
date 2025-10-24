/**
 * Modelo de Evaluación Individual Detallada
 */
export interface EvaluacionDetalle {
  criterios: Criterio[];
  totalScore: number;
  comentarios?: string;
  fecha?: string;
  comentariosCriterios?: { [criterioCodigo: string]: string };
  ajustesPuntaje?: { [criterioCodigo: string]: number };
}

/**
 * Modelo de Criterio de Evaluación
 */
export interface Criterio {
  nombre: string;
  descripcion: string;
  selectedLevel?: number;
  points: number;
  niveles: Nivel[];
}

/**
 * Modelo de Nivel de Criterio
 */
export interface Nivel {
  nivel: number;
  descripcion: string;
  puntos: number;
}

/**
 * Modelo de Evaluación de Estudiante
 */
export interface Evaluacion {
  correo: string;
  pg_score?: number;
  pi_score?: number;
  ind_eval?: EvaluacionDetalle;
  grup_eval?: EvaluacionDetalle;
  sumatoria?: number;
  updatedAt?: string; // <-- Agrega esta línea
}

/**
 * Estructura de evaluaciones por entrega
 */
export interface EvaluacionesCurso {
  E1?: { [correo: string]: Evaluacion };
  E2?: { [correo: string]: Evaluacion };
  EF?: { [correo: string]: Evaluacion };
}
