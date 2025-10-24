import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Evaluacion } from '../../core/models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {

  constructor() { }

  getEvaluacionPorEstudiante(idEstudiante: number): Observable<Evaluacion | null> {
    // Lógica de ejemplo, reemplaza con llamada HTTP real si es necesario
    return of(null);
  }

  guardarEvaluacion(evaluacion: Evaluacion): Observable<Evaluacion> {
    // Lógica de ejemplo, reemplaza con llamada HTTP real si es necesario
    return of(evaluacion);
  }

  // Puedes agregar más métodos según las necesidades de tu aplicación
}
