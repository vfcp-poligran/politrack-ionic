// Update the import path to the correct location
import { DatabaseService } from 'src/app/core/services/database.service';
// Update the import path to the correct location
import { ValidatorService } from 'src/app/core/services/validator.service';
import { Estudiante } from 'src/app/core/models/estudiante.model'; // Import Estudiante type
import { Curso } from 'src/app/core/models/curso.model'; // Import Curso type

export class CursoService {
  constructor(
    private databaseService: DatabaseService,
    private validatorService: ValidatorService  // ← Inyectar
  ) {}

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
}
