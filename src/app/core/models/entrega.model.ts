export enum TipoEntrega {
  E1 = 'E1',
  E2 = 'E2',
  EF = 'EF'
}

/**
 * Array de todas las entregas para iteración
 */
export const ENTREGAS = [
  TipoEntrega.E1,
  TipoEntrega.E2,
  TipoEntrega.EF
] as const;

/**
 * Labels amigables para mostrar en UI
 */
export const ENTREGA_LABELS: Record<TipoEntrega, string> = {
  [TipoEntrega.E1]: 'Entrega 1',
  [TipoEntrega.E2]: 'Entrega 2',
  [TipoEntrega.EF]: 'Entrega Final'
};

/**
 * Validar si un string es una entrega válida
 */
export function isValidEntrega(value: string): value is TipoEntrega {
  return Object.values(TipoEntrega).includes(value as TipoEntrega);
}
