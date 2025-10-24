import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Componente base que proporciona destroy$ automático
 * Usar como clase base para componentes que necesitan cleanup
 */
@Directive()
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Uso en componentes
// Ejemplo de uso de BaseComponent:
// Ver archivo separado para la implementación de HomePage.
