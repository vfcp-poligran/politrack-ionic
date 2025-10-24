import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush  // ✅ AGREGAR
})
export class HomePage {
  // Solo se verifica cuando:
  // 1. Input properties cambian
  // 2. Se dispara evento DOM en template
  // 3. Se emite Observable inyectado con async pipe
}
