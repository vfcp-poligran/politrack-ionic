import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Curso, Estudiante } from '../models';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  private databaseService = inject(DatabaseService);

  // BehaviorSubject para mantener la lista de cursos en memoria y notificar cambios
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  public cursos$: Observable<Curso[]> = this.cursosSubject.asObservable();

  constructor() {
    // Cargar los cursos al iniciar el servicio (después de que la DB esté lista)
    // this.loadCursos(); // Es mejor llamarlo desde HomePage
  }

  /**
   * Carga (o recarga) todos los cursos desde la base de datos
   * y actualiza el BehaviorSubject.
   */
  async loadCursos(): Promise<void> {
    try {
      const cursosMap = await this.databaseService.getCursos();
      const cursosArray = Object.values(cursosMap);
      this.cursosSubject.next(cursosArray);
      console.log('Cursos cargados en el servicio:', cursosArray.length);
    } catch (error) {
      console.error("Error al cargar cursos en CursoService:", error);
      this.cursosSubject.next([]); // Emitir array vacío en caso de error
    }
  }

  /**
   * Obtiene la lista actual de cursos del BehaviorSubject.
   * Usar 'cursos$' para suscripciones reactivas.
   */
  getCursosSnapshot(): Curso[] {
    return this.cursosSubject.getValue();
  }

  /**
   * Obtiene un solo curso desde la base de datos.
   * NOTA: Este método carga desde la DB, no del snapshot.
   * El 'curso-detail.page' usa este método.
   */
  async getCurso(cursoId: string): Promise<Curso | null> {
    try {
      return await this.databaseService.getCurso(cursoId);
    } catch (error) {
      console.error(`Error al obtener curso ${cursoId}:`, error);
      return null;
    }
  }

  /**
   * Agrega un nuevo curso a la base de datos y actualiza el Subject.
   */
  async addCurso(nombre: string, estudiantes: Estudiante[]): Promise<Curso> {
    try {
      const nuevoCurso: Curso = {
        id: uuidv4(),
        nombre: nombre,
        estudiantes: estudiantes,
        evaluaciones: {}, // Inicia vacío
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.databaseService.saveCurso(nuevoCurso.id, nuevoCurso);

      // Actualizar el Subject local
      const cursosActuales = this.getCursosSnapshot();
      this.cursosSubject.next([...cursosActuales, nuevoCurso]);

      return nuevoCurso;
    } catch (error) {
      console.error("Error al agregar curso:", error);
      throw error; // Relanzar para que la UI maneje el error
    }
  }

  /**
   * Actualiza parcialmente un curso en la base de datos y actualiza el Subject.
   */
  async updateCurso(cursoId: string, data: Partial<Curso>): Promise<void> {
    try {
      // Obtener el curso existente para fusionar datos
      const cursoExistente = await this.getCurso(cursoId);
      if (!cursoExistente) {
        throw new Error('El curso que intenta actualizar no existe.');
      }

      const cursoActualizado = { ...cursoExistente, ...data, updatedAt: new Date().toISOString() };

      await this.databaseService.saveCurso(cursoId, cursoActualizado);

      // Actualizar el Subject local
      const cursosActuales = this.getCursosSnapshot();
      const index = cursosActuales.findIndex(c => c.id === cursoId);
      if (index !== -1) {
        cursosActuales[index] = cursoActualizado;
        this.cursosSubject.next([...cursosActuales]);
      } else {
        // Si no estaba en la lista por alguna razón, recargar todo
        await this.loadCursos();
      }
    } catch (error) {
      console.error(`Error al actualizar curso ${cursoId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un curso de la base de datos y actualiza el Subject.
   */
  async deleteCurso(cursoId: string): Promise<void> {
    try {
      await this.databaseService.deleteCurso(cursoId);

      // Actualizar el Subject local
      const cursosActuales = this.getCursosSnapshot();
      const cursosFiltrados = cursosActuales.filter(c => c.id !== cursoId);
      this.cursosSubject.next(cursosFiltrados);
    } catch (error) {
      console.error(`Error al eliminar curso ${cursoId}:`, error);
      throw error;
    }
  }
}
