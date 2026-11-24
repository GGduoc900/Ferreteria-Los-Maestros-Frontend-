import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';
import {
  agregarItem, cambiarCantidad, cantidadTotal, leerCarritoGuardado, quitarItem, totalCarrito,
} from '../utils/cart';

export const CLAVE_CARRITO = 'lm_carrito';

interface CartContextValue {
  items: CartItem[];
  /** Cantidad de unidades en el carrito (para la insignia del menú). */
  cantidad: number;
  total: number;
  agregar: (product: Product, cantidad?: number) => void;
  cambiarCantidad: (codigo: string, cantidad: number) => void;
  quitar: (codigo: string) => void;
  vaciar: () => void;
  enCarrito: (codigo: string) => number;
}

/** Valor por defecto inerte: permite renderizar tarjetas sueltas (pruebas) sin proveedor. */
const vacio: CartContextValue = {
  items: [], cantidad: 0, total: 0,
  agregar: () => undefined, cambiarCantidad: () => undefined, quitar: () => undefined,
  vaciar: () => undefined, enCarrito: () => 0,
};

const CartContext = createContext<CartContextValue>(vacio);

/** Carrito de compras. Se guarda en localStorage: sobrevive a recargas de página. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => leerCarritoGuardado(localStorage.getItem(CLAVE_CARRITO)));

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch { /* almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria */ }
  }, [items]);

  // Sincroniza el carrito entre pestañas
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === null || e.key === CLAVE_CARRITO) setItems(leerCarritoGuardado(localStorage.getItem(CLAVE_CARRITO)));
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const agregar = useCallback((p: Product, n = 1) => setItems((prev) => agregarItem(prev, p, n)), []);
  const cambiar = useCallback((c: string, n: number) => setItems((prev) => cambiarCantidad(prev, c, n)), []);
  const quitar = useCallback((c: string) => setItems((prev) => quitarItem(prev, c)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cantidad: cantidadTotal(items),
      total: totalCarrito(items),
      agregar,
      cambiarCantidad: cambiar,
      quitar,
      vaciar,
      enCarrito: (codigo) => items.find((i) => i.product.codigo === codigo)?.cantidad ?? 0,
    }),
    [items, agregar, cambiar, quitar, vaciar],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = (): CartContextValue => useContext(CartContext);