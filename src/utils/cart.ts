import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';

/** Cantidad máxima que se puede llevar de un producto: su stock disponible. */
export const maxCantidad = (p: Pick<Product, 'stock'>): number => Math.max(0, Math.floor(p.stock));

export function agregarItem(items: CartItem[], product: Product, cantidad = 1): CartItem[] {
  const max = maxCantidad(product);
  if (max === 0 || cantidad <= 0) return items;
  const existente = items.find((i) => i.product.codigo === product.codigo);
  if (!existente) return [...items, { product, cantidad: Math.min(cantidad, max) }];
  return items.map((i) =>
    i.product.codigo === product.codigo
      ? { product, cantidad: Math.min(i.cantidad + cantidad, max) }
      : i,
  );
}

/** Fija la cantidad (limitada al stock). Con cantidad < 1 el producto se quita. */
export function cambiarCantidad(items: CartItem[], codigo: string, cantidad: number): CartItem[] {
  if (!Number.isFinite(cantidad) || cantidad < 1) return quitarItem(items, codigo);
  return items.map((i) =>
    i.product.codigo === codigo
      ? { ...i, cantidad: Math.min(Math.floor(cantidad), maxCantidad(i.product)) }
      : i,
  );
}

export const quitarItem = (items: CartItem[], codigo: string): CartItem[] =>
  items.filter((i) => i.product.codigo !== codigo);

export const subtotalItem = (i: CartItem): number => i.product.precioVenta * i.cantidad;
export const totalCarrito = (items: CartItem[]): number => items.reduce((s, i) => s + subtotalItem(i), 0);
export const cantidadTotal = (items: CartItem[]): number => items.reduce((s, i) => s + i.cantidad, 0);

/** Lee el carrito guardado ignorando datos corruptos. */
export function leerCarritoGuardado(crudo: string | null): CartItem[] {
  if (!crudo) return [];
  try {
    const data = JSON.parse(crudo) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (i): i is CartItem =>
        typeof i === 'object' && i !== null &&
        typeof (i as CartItem).cantidad === 'number' && (i as CartItem).cantidad >= 1 &&
        typeof (i as CartItem).product?.codigo === 'string' &&
        typeof (i as CartItem).product?.precioVenta === 'number',
    );
  } catch {
    return [];
  }
}