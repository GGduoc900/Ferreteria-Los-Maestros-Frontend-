import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Cargando } from '../components/atoms/Cargando';
import { ProductImage } from '../components/atoms/ProductImage';
import { SoloRol } from '../components/atoms/SoloRol';
import { getProductImage } from '../utils/image';
import { AddToCartButton } from '../components/molecules/AddToCartButton';
import { StockBadge } from '../components/molecules/StockBadge';
import { useCart } from '../context/CartContext';
import { useProducto } from '../hooks/useProducts';
import { maxCantidad } from '../utils/cart';
import { formatCLP } from '../utils/format';

export function ProductDetailPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { product, loading, error } = useProducto(codigo, 'catalogo');
  const { enCarrito } = useCart();
  const [cantidad, setCantidad] = useState(1);

  if (loading) return <Cargando texto="Cargando producto…" />;

  if (error || !product) {
    return (
      <>
        <Alert variant="danger">{error ? `No pudimos cargar el producto: ${error}` : 'Producto no encontrado.'}</Alert>
        <Link to="/" className="btn btn-outline-primary">Volver al catálogo</Link>
      </>
    );
  }

  return (
    <>
      <Link to="/" className="btn btn-link px-0 mb-2">← Volver al catálogo</Link>
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="lm-detail-img">
            <ProductImage src={getProductImage(product)} alt={product.nombre} height={340} />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="lm-panel p-4 h-100">
            <span className="lm-tag">{product.categoria}</span>
            <small className="text-muted d-block mt-2">{product.codigo} · {product.subcategoria}</small>
            <h1 className="h3 mt-1">{product.nombre}</h1>
            <p className="text-muted">Marca: {product.marca} · Unidad: {product.unidad}</p>
            {product.descripcion && <p>{product.descripcion}</p>}
            <p className="lm-detail-price mb-3">{formatCLP(product.precioVenta)}</p>
            <p className="mb-2">Stock disponible: <strong>{product.stock}</strong> (mínimo de reposición: {product.stockMinimo})</p>
            <StockBadge product={product} />
            {maxCantidad(product) > 0 && (
              <div className="d-flex flex-wrap align-items-end gap-3 mt-3">
                <div>
                  <label htmlFor="cantidad" className="form-label fw-semibold mb-1">Cantidad</label>
                  <input
                    id="cantidad"
                    type="number"
                    className="form-control"
                    style={{ width: 100 }}
                    min={1}
                    max={maxCantidad(product)}
                    value={cantidad}
                    onChange={(e) => {
                      const n = Math.floor(Number(e.target.value));
                      setCantidad(Number.isFinite(n) ? Math.min(Math.max(n, 1), maxCantidad(product)) : 1);
                    }}
                  />
                </div>
                <AddToCartButton product={product} cantidad={cantidad} className="btn btn-primary" />
                {enCarrito(product.codigo) > 0 && (
                  <Link to="/carrito" className="btn btn-outline-primary">
                    Ver carrito ({enCarrito(product.codigo)})
                  </Link>
                )}
              </div>
            )}
            {/* Acción visible solo para administradores */}
            <SoloRol roles={['ADMIN']}>
              <div className="mt-3">
                <Link to={`/admin/editar/${product.codigo}`} className="btn btn-outline-primary btn-sm">Editar producto</Link>
              </div>
            </SoloRol>
          </div>
        </div>
      </div>
    </>
  );
}