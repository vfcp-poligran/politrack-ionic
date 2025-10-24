import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { Curso } from '../models';

/**
 * Servicio de gestión de cursos
 */
@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private db = inject(DatabaseService);
  
  private cursosSubject = new BehaviorSubject<{ [key: string]: Curso }>({});
  public cursos$ = this.cursosSubject.asObservable();

  private cursoActivoSubject = new BehaviorSubject<string | null>(null);
  public cursoActivo$ = this.cursoActivoSubject.asObservable();

  /**
   * Carga todos los cursos desde la base de datos
   */
  async loadCursos(): Promise<void> {
    const cursos = await this.db.getCursos();
    this.cursosSubject.next(cursos);
  }

  /**
   * Obtiene un curso específico
   */
  async getCurso(cursoId: string): Promise<Curso | null> {
    const curso = await this.db.getCurso(cursoId);
    return curso ?? null;
  }

  /**
   * Crea un nuevo curso
   */
  async createCurso(curso: Curso): Promise<void> {
    await this.db.saveCurso(curso.id, curso);
    await this.loadCursos();
  }

  /**
   * Actualiza un curso existente
   */
  async updateCurso(cursoId: string, cursoData: Partial<Curso>): Promise<void> {
    await this.db.saveCurso(cursoId, cursoData);
    await this.loadCursos();
  }

  /**
   * Elimina un curso
   */
  async deleteCurso(cursoId: string): Promise<void> {
    await this.db.deleteCurso(cursoId);
    await this.loadCursos();

    // Si el curso eliminado era el activo, limpiar
    if (this.cursoActivoSubject.value === cursoId) {
      this.cursoActivoSubject.next(null);
    }
  }

  /**
   * Establece el curso activo
   */
  setCursoActivo(cursoId: string | null): void {
    this.cursoActivoSubject.next(cursoId);
  }

  /**
   * Crea un curso desde un archivo CSV
   */
  async createCursoFromCSV(csvData: string, nombreCurso: string): Promise<string> {
    const estudiantes = this.parseCSV(csvData);

    const curso: Curso = {
      id: this.generateCursoId(nombreCurso),
      nombre: nombreCurso,
      estudiantes: estudiantes,
      evaluaciones: {
        E1: {},
        E2: {},
        EF: {}
      },
      createdAt: new Date().toISOString()
    };

    await this.createCurso(curso);
    return curso.id;
  }

  /**
   * Parsea un archivo CSV y retorna los estudiantes
   */
  private parseCSV(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    const estudiantes: any[] = [];

    // Saltar la primera línea (encabezado)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(';');
      if (parts.length >= 5) {
        estudiantes.push({
          apellidos: parts[0].trim(),
          nombres: parts[1].trim(),
          correo: parts[2].trim(),
          grupo: parts[3].trim(),
          subgrupo: parts[4].trim()
        });
      }
    }

    return estudiantes;
  }

  /**
   * Genera un ID único para el curso
   */
  private generateCursoId(nombreCurso: string): string {
    const timestamp = Date.now();
    const sanitized = nombreCurso.toLowerCase().replace(/\s+/g, '-');
    return `${sanitized}-${timestamp}`;
  }

  /**
   * Exporta un curso a formato CSV
   */
  async exportCursoToCSV(cursoId: string): Promise<string> {
    const curso = await this.getCurso(cursoId);
    if (!curso) {
      throw new Error('Curso no encontrado');
    }

    let csv = 'Apellidos;Nombres;Correo;Grupo;Subgrupo;E1-PG;E1-PI;E1-Σ;E2-PG;E2-PI;E2-Σ;EF-PG;EF-PI;EF-Σ\n';

    curso.estudiantes.forEach(est => {
      const e1 = curso.evaluaciones?.E1?.[est.correo];
      const e2 = curso.evaluaciones?.E2?.[est.correo];
      const ef = curso.evaluaciones?.EF?.[est.correo];

      csv += `${est.apellidos};${est.nombres};${est.correo};${est.grupo};${est.subgrupo}`;
      csv += `;${e1?.pg_score || ''};${e1?.pi_score || ''};${e1?.sumatoria || ''}`;
      csv += `;${e2?.pg_score || ''};${e2?.pi_score || ''};${e2?.sumatoria || ''}`;
      csv += `;${ef?.pg_score || ''};${ef?.pi_score || ''};${ef?.sumatoria || ''}\n`;
    });

    return csv;
  }

  /**
   * Obtiene el observable de cursos
   */
  getCursosObservable(): Observable<{ [key: string]: Curso }> {
    return this.cursos$;
  }

  /**
   * Obtiene el valor actual de cursos
   */
  getCursosValue(): { [key: string]: Curso } {
    return this.cursosSubject.value;
  }
}
