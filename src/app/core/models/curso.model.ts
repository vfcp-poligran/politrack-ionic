import { Estudiante } from './estudiante.model';
import { EvaluacionesCurso } from './evaluacion.model';

/**
 * Modelo de Curso
 */
export interface Curso {
  id: string;
  codigo?: string;
  nombre: string;
  estudiantes: Estudiante[];
  evaluaciones: EvaluacionesCurso;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Opciones de configuración del curso
 */
export interface CursoConfig {
  entregas: string[];
  tipoEvaluacion: 'PG_PI' | 'INDIVIDUAL';
  enableComments: boolean;
}

/**
 * Datos para importación de curso desde CSV
 */
export interface CursoImportData {
  nombre: string;
  csvContent: string;
  config?: CursoConfig;
}
