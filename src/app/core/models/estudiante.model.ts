/**
 * Modelo de Estudiante
 */
export interface Estudiante {
  apellidos: string;
  nombres: string;
  correo: string;
  grupo: string;
  subgrupo: string;
  checked?: boolean;
}

/**
 * Filtro para búsqueda de estudiantes
 */
export interface EstudianteFilter {
  searchText?: string;
  subgrupo?: string;
  grupo?: string;
}
