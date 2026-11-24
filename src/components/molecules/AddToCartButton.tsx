import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types/product';
import { maxCantidad } from '../../utils/cart';

interface AddToCartButtonProps {
  product: Product;
  /** Unidades a agregar por clic (por defecto 1). */
  cantidad?: number;
  className?: string;
}

/** Botón "Agregar al carrito": se desactiva sin stock o al llegar al máximo disponible. *//////////
export function AddToCartButton({ product, cantidad = 1, className = 'btn btn-primary btn-sm' }: AddToCartButtonProps) {
  const { agregar, enCarrito } = useCart();
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    if (!agregado) return;
    const id = window.setTimeout(() => setAgregado(false), 1600);
    return () => window.clearTimeout(id);
  }, [agregado]);

  const max = maxCantidad(product);
  const enElCarrito = enCarrito(product.codigo);
  const sinStock = max === 0;
  const alMaximo = !sinStock && enElCarrito >= max;

  return (
    <button
      type="button"
      className={className}
      disabled={sinStock || alMaximo}
      aria-label={`Agregar ${product.nombre} al carrito`}
      onClick={() => { agregar(product, cantidad); setAgregado(true); }}
    >
      {sinStock ? 'Sin stock' : alMaximo ? 'Máximo en carrito' : agregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
    </button>
  );
}