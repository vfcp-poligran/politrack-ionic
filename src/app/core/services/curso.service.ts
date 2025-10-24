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

  /**
   * Establece el curso activo (puede usarse para navegación o estado global)
   */
  setCursoActivo(cursoId: string): void {
    // Por ahora, solo log. Puede extenderse para mantener estado global
    console.log('Curso activo establecido:', cursoId);
  }

  /**
   * Crea un curso desde datos CSV
   */
  async createCursoFromCSV(csvData: string, nombreCurso: string): Promise<string> {
    try {
      const estudiantes = this.parseCSVToEstudiantes(csvData);
      const nuevoCurso = await this.addCurso(nombreCurso, estudiantes);
      return nuevoCurso.id;
    } catch (error) {
      console.error('Error al crear curso desde CSV:', error);
      throw error;
    }
  }

  /**
   * Parsea datos CSV y devuelve un array de estudiantes
   */
  private parseCSVToEstudiantes(csvData: string): Estudiante[] {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const estudiantes: Estudiante[] = [];

    // Asumiendo formato: apellidos,nombres,correo,subgrupo
    for (let i = 1; i < lines.length; i++) { // Saltar header
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 4) {
        estudiantes.push({
          apellidos: values[0],
          nombres: values[1],
          correo: values[2],
          subgrupo: values[3]
        });
      }
    }

    return estudiantes;
  }

  /**
   * Exporta un curso a formato CSV
   */
  async exportCursoToCSV(cursoId: string): Promise<string> {
    try {
      const curso = await this.getCurso(cursoId);
      if (!curso) {
        throw new Error('Curso no encontrado');
      }

      let csv = 'apellidos,nombres,correo,subgrupo\n';
      curso.estudiantes.forEach(est => {
        csv += `${est.apellidos},${est.nombres},${est.correo},${est.subgrupo}\n`;
      });

      return csv;
    } catch (error) {
      console.error('Error al exportar curso a CSV:', error);
      throw error;
    }
  }
}
