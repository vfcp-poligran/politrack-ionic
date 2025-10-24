import { Injectable } from '@angular/core';
import { Curso, Estudiante, Evaluacion } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  /**
   * Valida un email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida un estudiante
   */
  validateEstudiante(estudiante: Estudiante): ValidationResult {
    const errors: string[] = [];

    if (!estudiante.apellidos?.trim()) {
      errors.push('Apellidos requeridos');
    }

    if (!estudiante.nombres?.trim()) {
      errors.push('Nombres requeridos');
    }

    if (!this.validateEmail(estudiante.correo)) {
      errors.push('Email inválido');
    }

    if (!estudiante.grupo?.trim()) {
      errors.push('Grupo requerido');
    }

    if (!estudiante.subgrupo?.trim()) {
      errors.push('Subgrupo requerido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida un curso
   */
  validateCurso(curso: Curso): ValidationResult {
    const errors: string[] = [];

    if (!curso.nombre?.trim()) {
      errors.push('Nombre del curso requerido');
    }

    if (!Array.isArray(curso.estudiantes) || curso.estudiantes.length === 0) {
      errors.push('Debe tener al menos un estudiante');
    } else {
      // Validar cada estudiante
      curso.estudiantes.forEach((est, index) => {
        const result = this.validateEstudiante(est);
        if (!result.valid) {
          errors.push(`Estudiante ${index + 1}: ${result.errors.join(', ')}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida evaluación
   */
  validateEvaluacion(
    evaluacion: Evaluacion,
    maxPuntos: number = 100
  ): ValidationResult {
    const errors: string[] = [];

    if (evaluacion.pg_score !== undefined) {
      if (evaluacion.pg_score < 0 || evaluacion.pg_score > maxPuntos) {
        errors.push(`PG_SCORE debe estar entre 0 y ${maxPuntos}`);
      }
    }

    if (evaluacion.pi_score !== undefined) {
      if (evaluacion.pi_score < 0 || evaluacion.pi_score > maxPuntos) {
        errors.push(`PI_SCORE debe estar entre 0 y ${maxPuntos}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Interface para resultados de validación
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
