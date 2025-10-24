export enum TipoEntrega {
  E1 = 'E1',
  E2 = 'E2',
  EF = 'EF'
}

export const ENTREGAS: TipoEntrega[] = [TipoEntrega.E1, TipoEntrega.E2, TipoEntrega.EF];

export const ENTREGA_LABELS: { [key in TipoEntrega]: string } = {
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
