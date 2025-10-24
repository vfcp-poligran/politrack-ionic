import { Injectable, inject } from '@angular/core';
import { Evaluacion } from '../models/evaluacion.model';
import { Curso } from '../models/curso.model';
import { Estudiante } from '../models/estudiante.model';
import { Storage } from '@ionic/storage-angular';

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
  private _storage: Storage | null = null;
  private storageService = inject(Storage);

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
      await this._storage?.set(key, evaluacionesCurso);

      console.log(`✓ Evaluación guardada para ${estudianteId} en ${entrega}`);
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      throw new Error(`No se pudo guardar evaluación: ${(error as Error).message}`);
    }
  }

  async getEvaluacionesCurso(cursoId: string): Promise<EvaluacionesCurso> {
    try {
      const key = `evaluaciones_${cursoId}`;
      const evaluaciones = await this._storage?.get(key);
      return evaluaciones || {} as EvaluacionesCurso;
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      return {} as EvaluacionesCurso;
    }
  }

  async getCursos(): Promise<Record<string, Curso>> {
    try {
      const cursos = await this._storage?.get('cursos');
      return cursos || {};
    } catch (error) {
      console.error('Error obteniendo cursos:', error);
      return {};
    }
  }

  async getCursoById(cursoId: string): Promise<Curso | null> {
    try {
      const cursos = await this.getCursos();
      return cursos[cursoId] || null;
    } catch (error) {
      console.error('Error obteniendo curso:', error);
      return null;
    }
  }

  async saveCurso(curso: Curso): Promise<void> {
    try {
      const cursos = await this.getCursos();
      cursos[curso.id] = curso;
      await this._storage?.set('cursos', cursos);
      console.log(`✓ Curso ${curso.id} guardado`);
    } catch (error) {
      console.error('Error guardando curso:', error);
      throw new Error(`No se pudo guardar curso: ${(error as Error).message}`);
    }
  }

  async getEstudiantesByCursoId(cursoId: string): Promise<Estudiante[]> {
    try {
      const key = `estudiantes_${cursoId}`;
      const estudiantes = await this._storage?.get(key);
      return estudiantes || [];
    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      return [];
    }
  }

  async saveEstudiantes(cursoId: string, estudiantes: Estudiante[]): Promise<void> {
    try {
      const key = `estudiantes_${cursoId}`;
      await this._storage?.set(key, estudiantes);
      console.log(`✓ Estudiantes guardados para curso ${cursoId}`);
    } catch (error) {
      console.error('Error guardando estudiantes:', error);
      throw new Error(`No se pudo guardar estudiantes: ${(error as Error).message}`);
    }
  }

  async deleteCursoById(cursoId: string): Promise<void> {
    try {
      const cursos = await this.getCursos();
      delete cursos[cursoId];
      await this._storage?.set('cursos', cursos);
      console.log(`✓ Curso ${cursoId} eliminado`);
    } catch (error) {
      console.error('Error eliminando curso:', error);
      throw new Error(`No se pudo eliminar curso: ${(error as Error).message}`);
    }
  }

  async deleteEstudiantesByCursoId(cursoId: string): Promise<void> {
    try {
      const key = `estudiantes_${cursoId}`;
      await this._storage?.remove(key);
      console.log(`✓ Estudiantes del curso ${cursoId} eliminados`);
    } catch (error) {
      console.error('Error eliminando estudiantes:', error);
      throw new Error(`No se pudo eliminar estudiantes: ${(error as Error).message}`);
    }
  }

  async deleteEvaluacionesByCursoId(cursoId: string): Promise<void> {
    try {
      const key = `evaluaciones_${cursoId}`;
      await this._storage?.remove(key);
      console.log(`✓ Evaluaciones del curso ${cursoId} eliminadas`);
    } catch (error) {
      console.error('Error eliminando evaluaciones:', error);
      throw new Error(`No se pudo eliminar evaluaciones: ${(error as Error).message}`);
    }
  }

  public async init(): Promise<void> {
    try {
      this._storage = await this.storageService.create();
      console.log('✓ Database Service initialized');
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }
}
