import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Curso, Estudiante } from '../models';
// El StorageService ya no es necesario, usamos DatabaseService
// import { StorageService } from './storage.service';
import { DatabaseService } from './database.service'; // <-- 1. Importar DatabaseService

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  // 2. Inyectar DatabaseService
  private databaseService = inject(DatabaseService);

  // 3. El BehaviorSubject se vuelve opcional.
  //    Lo mantendremos por ahora para notificar a la home page,
  //    pero la "fuente de la verdad" es la base de datos.
  private cursosSubject = new BehaviorSubject<Curso[]>([]);
  cursos$ = this.cursosSubject.asObservable();

  constructor() {
    // Cargar cursos al iniciar el servicio (después de que init() de DB se haya llamado en app.component)
    this.loadCursos();
  }

  /**
   * Carga todos los cursos desde DatabaseService y actualiza el Observable.
   */
  async loadCursos(): Promise<void> {
    try {
      const cursosObj = await this.databaseService.getCursos();
      // Convertir el objeto { id: curso } en un array [curso]
      const cursosArray = Object.values(cursosObj);
      this.cursosSubject.next(cursosArray);
    } catch (error) {
      console.error('Error al cargar cursos en CursoService:', error);
      this.cursosSubject.next([]); // Enviar array vacío en caso de error
    }
  }

  /**
   * Obtiene todos los cursos como un array.
   * Llama a loadCursos para asegurar que los datos están frescos.
   */
  async getCursos(): Promise<Curso[]> {
    await this.loadCursos(); // Recargar desde la DB
    return this.cursosSubject.getValue(); // Devolver el valor actual
  }

  /**
   * Agrega un nuevo curso a la base de datos.
   */
  async addCurso(nombre: string, estudiantes: Estudiante[]): Promise<Curso> {
    try {
      // Generar un ID único (ej. timestamp)
      const cursoId = `curso_${Date.now()}`;
      const nuevoCurso: Curso = {
        id: cursoId,
        nombre: nombre,
        estudiantes: estudiantes,
        evaluaciones: { E1: {}, E2: {}, EF: {} }, // Objeto de evaluaciones vacío
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 4. Llamar a databaseService.saveCurso
      await this.databaseService.saveCurso(cursoId, nuevoCurso);

      // 5. Recargar la lista de cursos
      await this.loadCursos();
      return nuevoCurso;
    } catch (error) {
      console.error('Error al agregar curso:', error);
      throw new Error('No se pudo agregar el curso.');
    }
  }

  /**
   * Obtiene un solo curso desde la base de datos.
   * Nota: Este método no carga evaluaciones, eso lo hace curso-detail.
   */
  async getCurso(id: string): Promise<Curso | null> {
    try {
      // 6. Llamar a databaseService.getCurso
      return await this.databaseService.getCurso(id);
    } catch (error) {
      console.error(`Error al obtener curso ${id}:`, error);
      return null;
    }
  }

  /**
   * Actualiza los datos de un curso (ej. la lista de estudiantes).
   */
  async updateCurso(cursoId: string, data: Partial<Curso>): Promise<void> {
    try {
      // 7. Llamar a databaseService.saveCurso (funciona como 'upsert')
      //    Aseguramos que 'updatedAt' se actualice si el trigger de DB falla
      data.updatedAt = new Date().toISOString();
      await this.databaseService.saveCurso(cursoId, data);

      // 8. Recargar la lista de cursos
      await this.loadCursos();
    } catch (error) {
      console.error(`Error al actualizar curso ${cursoId}:`, error);
      throw new Error('No se pudo actualizar el curso.');
    }
  }

  /**
   * Elimina un curso de la base de datos.
   */
  async deleteCurso(cursoId: string): Promise<void> {
    try {
      // 9. Llamar a databaseService.deleteCurso
      await this.databaseService.deleteCurso(cursoId);

      // 10. Recargar la lista de cursos
      await this.loadCursos();
    } catch (error) {
      console.error(`Error al eliminar curso ${cursoId}:`, error);
      throw new Error('No se pudo eliminar el curso.');
    }
  }
}
