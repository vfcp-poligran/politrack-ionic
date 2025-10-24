import { TipoEntrega, ENTREGAS, ENTREGA_LABELS } from '../../core/models';

@Component({
  selector: 'app-curso-detail',
  templateUrl: './curso-detail.page.html'
})
export class CursoDetailPage {
  entregas = ENTREGAS;  // ✅ Tipo seguro
  entregaActiva: TipoEntrega = TipoEntrega.E1;  // ✅ Enum, no string

  getLabel(entrega: TipoEntrega): string {
    return ENTREGA_LABELS[entrega];  // ✅ Label amigable
  }
}
