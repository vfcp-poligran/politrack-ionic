// Update the import path to the correct location
import { DatabaseService } from 'src/app/core/services/database.service';
// Update the import path to the correct location
import { ValidatorService } from 'src/app/core/services/validator.service';
import { Estudiante } from 'src/app/core/models/estudiante.model'; // Import Estudiante type
import { Curso } from 'src/app/core/models/curso.model'; // Import Curso type
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private cursoActivoId: string | null = null;

  constructor(
    private databaseService: DatabaseService,
    private validatorService: ValidatorService  // ← Inyectar
  ) {}

  setCursoActivo(id: string): void {
    this.cursoActivoId = id;
  }

  getCursoActivo(): string | null {
    return this.cursoActivoId;
  }

  async addCurso(nombre: string, estudiantes: Estudiante[]): Promise<Curso> {
    // ✅ Validar antes de guardar
    const cursoTemp: Curso = { id: '', nombre, estudiantes, evaluaciones: {} };
    const validation = this.validatorService.validateCurso(cursoTemp);

    if (!validation.valid) {
      throw new Error(`Validación fallida: ${validation.errors.join('; ')}`);
    }

    // Continuar con lógica de guardado...
    // Simulación de guardado y retorno del curso creado
    // Reemplaza esto con la lógica real de guardado si es necesario
    return cursoTemp;
  }

  getCursos(): Observable<Record<string, Curso>> {
    // Replace this with your actual implementation
    // Example mock implementation:
    const cursos: Record<string, Curso> = {};
    return of(cursos);
  }

  /**
   * Crea un curso a partir de datos CSV y un nombre.
   * Retorna el ID del curso creado.
   */
  async createCursoFromCSV(csvData: string, nombreCurso: string): Promise<string> {
    // Implementa aquí la lógica para parsear el CSV, crear el curso y devolver el ID.
    // Ejemplo básico (ajusta según tu lógica real):
    const newCurso: Curso = {
      id: Date.now().toString(),
      nombre: nombreCurso,
      estudiantes: [], // O ajusta según los datos del CSV si es necesario
      evaluaciones: {}
    };
    // Supón que tienes un método para guardar el curso:
    await this.saveCurso(newCurso, csvData);
    return newCurso.id;
  }

  // Asegúrate de tener un método saveCurso o implementa la lógica de guardado.
  private async saveCurso(curso: Curso, csvData: string): Promise<void> {
    // Implementa el guardado real aquí.
  }

  /**
   * Exporta un curso a CSV por su ID
   */
  async exportCursoToCSV(cursoId: string): Promise<string> {
    // Implementa aquí la lógica para obtener los datos del curso y convertirlos a CSV
    // Por ejemplo:
    const curso = await this.getCursoById(cursoId); // Asegúrate de tener este método
    if (!curso) {
      throw new Error('Curso no encontrado');
    }
    // Aquí deberías convertir el objeto curso a formato CSV
    // Esto es solo un ejemplo básico:
    let csv = 'id,nombre\n';
    csv += `${curso.id},${curso.nombre}\n`;
    // Agrega aquí la lógica para exportar los datos relacionados (alumnos, notas, etc.)
    return csv;
  }

  /**
   * Obtiene un curso por su ID.
   */
  async getCursoById(cursoId: string): Promise<Curso | null> {
    // Implementa la lógica real para obtener el curso desde la base de datos.
    // Ejemplo básico usando databaseService (ajusta según tu implementación real):
    const cursos = await this.databaseService.getCursos(); // Suponiendo que retorna un Record<string, Curso>
    return cursos[cursoId] || null;
  }

  /**
   * Elimina un curso por su ID
   */
  async deleteCurso(cursoId: string): Promise<void> {
    // Elimina el curso de la base de datos usando métodos existentes en DatabaseService
    await this.databaseService.deleteCursoById(cursoId);
    // Elimina estudiantes relacionados
    await this.databaseService.deleteEstudiantesByCursoId(cursoId);
    // Elimina evaluaciones relacionadas
    await this.databaseService.deleteEvaluacionesByCursoId(cursoId);
    // Agrega aquí cualquier otra limpieza necesaria
  }
}
