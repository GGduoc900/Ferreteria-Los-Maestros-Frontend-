import type { CartItem } from '../../types/cart';
import { subtotalItem } from '../../utils/cart';
import { formatCLP } from '../../utils/format';

/** Lista compacta de productos y total (se usa en el pago). */
export function ResumenPedido({ items, total }: { items: CartItem[]; total: number }) {
  return (
    <>
      <ul className="list-unstyled mb-3">
        {items.map((i) => (
          <li key={i.product.codigo} className="d-flex justify-content-between gap-3 py-1 small">
            <span>{i.cantidad} × {i.product.nombre}</span>
            <span className="text-nowrap">{formatCLP(subtotalItem(i))}</span>
          </li>
        ))}
      </ul>
      <div className="d-flex justify-content-between align-items-center border-top pt-3">
        <strong>Total a pagar</strong>
        <span className="lm-price">{formatCLP(total)}</span>
      </div>
    </>
  );
}