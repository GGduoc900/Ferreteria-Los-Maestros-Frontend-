import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { ProductImage } from '../components/atoms/ProductImage';
import { useCart } from '../context/CartContext';
import { maxCantidad, subtotalItem } from '../utils/cart';
import { formatCLP } from '../utils/format';
import { getProductImage } from '../utils/image';

export function CarritoPage() {
  const { items, cantidad, total, cambiarCantidad, quitar, vaciar } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="lm-panel p-5 text-center">
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🛒</div>
        <h1 className="h3">Tu carrito está vacío</h1>
        <p className="text-muted">Agrega productos desde el catálogo para armar tu pedido.</p>
        <Link to="/" className="btn btn-primary">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="h3 mb-3">Carrito de compras</h1>
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="lm-panel p-0">
            <ul className="list-unstyled mb-0">
              {items.map((i) => {
                const p = i.product;
                const max = maxCantidad(p);
                return (
                  <li key={p.codigo} className="lm-cart-row" data-testid={`item-${p.codigo}`}>
                    <div className="lm-cart-thumb">
                      <ProductImage src={getProductImage(p)} alt={p.nombre} height={80} />
                    </div>
                    <div className="flex-grow-1">
                      <Link to={`/producto/${p.codigo}`} className="fw-semibold text-decoration-none">{p.nombre}</Link>
                      <div className="small text-muted">{p.codigo} · {p.marca} · {formatCLP(p.precioVenta)} c/u</div>
                      {i.cantidad >= max && <div className="small text-warning-emphasis">Máximo disponible: {max}</div>}
                    </div>
                    <div className="lm-qty" role="group" aria-label={`Cantidad de ${p.nombre}`}>
                      <button
                        type="button" className="btn btn-outline-secondary btn-sm"
                        aria-label={`Quitar una unidad de ${p.nombre}`}
                        onClick={() => cambiarCantidad(p.codigo, i.cantidad - 1)}
                      >−</button>
                      <span className="lm-qty-value" aria-live="polite">{i.cantidad}</span>
                      <button
                        type="button" className="btn btn-outline-secondary btn-sm"
                        aria-label={`Agregar una unidad de ${p.nombre}`}
                        disabled={i.cantidad >= max}
                        onClick={() => cambiarCantidad(p.codigo, i.cantidad + 1)}
                      >+</button>
                    </div>
                    <div className="lm-cart-subtotal">{formatCLP(subtotalItem(i))}</div>
                    <button
                      type="button" className="btn btn-outline-danger btn-sm"
                      aria-label={`Eliminar ${p.nombre} del carrito`}
                      onClick={() => quitar(p.codigo)}
                    >Eliminar</button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="d-flex justify-content-between mt-3">
            <Link to="/" className="btn btn-link px-0">← Seguir comprando</Link>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={vaciar}>Vaciar carrito</button>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <aside className="lm-panel p-4" aria-label="Resumen del pedido">
            <h2 className="h5">Resumen</h2>
            <div className="d-flex justify-content-between small text-muted mb-2">
              <span>{cantidad} {cantidad === 1 ? 'producto' : 'productos'}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
              <strong>Total</strong>
              <span className="lm-price" data-testid="total-carrito">{formatCLP(total)}</span>
            </div>
            <button type="button" className="btn btn-primary w-100" onClick={() => navigate('/pago')}>
              Ir a pagar
            </button>
            <Alert variant="info">
              <small>Los precios incluyen IVA. Podrás elegir tu método de pago en el siguiente paso.</small>
            </Alert>
          </aside>
        </div>
      </div>
    </>
  );
}