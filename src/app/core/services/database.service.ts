import { Injectable } from '@angular/core';
import { Curso, EvaluacionesCurso } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  async init(): Promise<void> {
    // Inicialización de la base de datos
  }

  async saveCurso(_cursoId: string, _cursoData: Partial<Curso>): Promise<void> {
    // Guarda curso
  }

  async getCurso(_cursoId: string): Promise<Curso | undefined> {
    // Obtiene curso
    return undefined;
  }

  async getCursos(): Promise<{ [key: string]: Curso }> {
    // Obtiene todos los cursos
    return {};
  }

  async deleteCurso(_cursoId: string): Promise<void> {
    // Elimina curso
  }

  async getEvaluacionesCurso(_cursoId: string): Promise<EvaluacionesCurso> {
    // Obtiene evaluaciones
    return {} as EvaluacionesCurso;
  }

  async deleteEvaluacionesEstudiante(_cursoId: string, _estudianteId: string): Promise<void> {
    // Elimina evaluaciones de estudiante
  }

  async saveFullEvaluacionEstudiante(
    _cursoId: string,
    _estudianteId: string,
    _entrega: 'E1' | 'E2' | 'EF',
    _evaluacion: any
  ): Promise<void> {
    // Guarda evaluación completa de estudiante
  }

  async getComentariosComunes(): Promise<string[]> {
    // Obtiene comentarios comunes
    return [];
  }

  async saveComentariosComunes(_comentarios: string[]): Promise<void> {
    // Guarda comentarios comunes
  }

  async addComentarioComun(_comentario: string): Promise<void> {
    // Añade comentario común
  }

  async saveRubrica(_rubricaId: string, _rubricaData: any): Promise<void> {
    // Guarda rúbrica
  }

  async getRubricas(): Promise<{ [key: string]: any }> {
    // Obtiene rúbricas
    return {};
  }

  async saveUIState(_uiState: any): Promise<void> {
    // Guarda estado UI
  }

  async getUIState(): Promise<any> {
    // Obtiene estado UI
    return {};
  }

  async clearDatabase(): Promise<void> {
    // Limpia la base de datos
  }

  async close(): Promise<void> {
    // Cierra la base de datos
  }
}
