import { Injectable } from '@angular/core';
import { Evaluacion } from '../models/evaluacion.model'; // Ajusta la ruta según corresponda

// Define EvaluacionesCurso type
type EvaluacionesCurso = {
  [entrega: string]: {
    [estudianteId: string]: Evaluacion & { updatedAt: string }
  }
};

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  /**
   * Guarda la evaluación completa de un estudiante para una entrega
   * @param cursoId ID del curso
   * @param estudianteId Email del estudiante (identificador)
   * @param entrega Tipo de entrega (E1, E2, EF)
   * @param evaluacion Datos de la evaluación a guardar
   */
  async saveFullEvaluacionEstudiante(
    cursoId: string,
    estudianteId: string,
    entrega: 'E1' | 'E2' | 'EF',
    evaluacion: Evaluacion
  ): Promise<void> {
    if (!cursoId || !estudianteId || !entrega) {
      throw new Error('Parámetros requeridos no proporcionados');
    }

    try {
      // Obtener evaluaciones del curso
      let evaluacionesCurso = await this.getEvaluacionesCurso(cursoId);

      // Inicializar la entrega si no existe
      if (!evaluacionesCurso[entrega]) {
        evaluacionesCurso[entrega] = {};
      }

      // Guardar la evaluación del estudiante
      (evaluacionesCurso[entrega] as any)[estudianteId] = {
        ...evaluacion,
        updatedAt: new Date().toISOString()
      };

      // Persistir en BD
      const key = `evaluaciones_${cursoId}`;
      await this.storage?.set(key, evaluacionesCurso);

      console.log(`✓ Evaluación guardada para ${estudianteId} en ${entrega}`);
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      throw new Error(`No se pudo guardar evaluación: ${error}`);
    }
  }

  // Método auxiliar que probablemente falta
  private storage: any; // Inyectarías el servicio real

  async getEvaluacionesCurso(cursoId: string): Promise<EvaluacionesCurso> {
    try {
      const key = `evaluaciones_${cursoId}`;
      const evaluaciones = await this.storage?.get(key);
      return evaluaciones || {} as EvaluacionesCurso;
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return {} as EvaluacionesCurso;
    }
  }
}
