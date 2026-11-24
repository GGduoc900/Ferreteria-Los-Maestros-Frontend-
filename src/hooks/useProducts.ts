import { useCallback, useEffect, useState } from 'react';
import { productRepository } from '../services/productRepository';
import type { Product } from '../types/product';

const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.');

/** Vitrina pública: productos del microservicio de catálogo. */
export function useCatalogo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    productRepository
      .getCatalogo()
      .then((lista) => activo && setProducts(lista))
      .catch((e) => activo && setError(mensajeDe(e)))
      .finally(() => activo && setLoading(false));
    return () => {
      activo = false;
    };
  }, []);

  return { products, loading, error };
}

/** Un producto (detalle público o ficha de administración). */
export function useProducto(codigo: string | undefined, origen: 'catalogo' | 'admin' = 'catalogo') {
  const [product, setProduct] = useState<Product | undefined>();
  const [loading, setLoading] = useState(Boolean(codigo));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) return;
    let activo = true;
    setLoading(true);
    const pedir = origen === 'admin' ? productRepository.getById(codigo) : productRepository.getDetalle(codigo);
    pedir
      .then((p) => activo && setProduct(p))
      .catch((e) => activo && setError(mensajeDe(e)))
      .finally(() => activo && setLoading(false));
    return () => {
      activo = false;
    };
  }, [codigo, origen]);

  return { product, loading, error };
}

/** Administración: CRUD contra el microservicio de inventario (requiere ADMIN). */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProducts(await productRepository.getAll());
      setError(null);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProduct = async (product: Product) => {
    await productRepository.create(product);
    await refresh();
  };

  const updateProduct = async (codigo: string, changes: Partial<Omit<Product, 'codigo'>>) => {
    await productRepository.update(codigo, changes);
    await refresh();
  };

  const deleteProduct = async (codigo: string) => {
    await productRepository.remove(codigo);
    await refresh();
  };

  return { products, loading, error, createProduct, updateProduct, deleteProduct, refresh };
}
