import { Component } from '@angular/core';

@Component({
  selector: 'app-curso-detail',
  templateUrl: './curso-detail.page.html',
  styleUrls: ['./curso-detail.page.scss']
})
export class CursoDetailPage {
  criterios = [
    {
      codigo: 'conocimiento_tecnico',
      nombre: 'Conocimiento Técnico',
      peso: 15,
      maxPuntos: 15,
      niveles: [
        { valor: 4, nombre: 'Insuficiente (0-4)', descripcion: 'Conocimiento técnico insuficiente.' },
        { valor: 8, nombre: 'Básico (5-8)', descripcion: 'Conocimiento técnico básico.' },
        { valor: 12, nombre: 'Bueno (9-12)', descripcion: 'Conocimiento técnico bueno.' },
        { valor: 15, nombre: 'Excelente (13-15)', descripcion: 'Conocimiento técnico excelente.' }
      ]
    }
    // ...otros criterios...
  ];
}
