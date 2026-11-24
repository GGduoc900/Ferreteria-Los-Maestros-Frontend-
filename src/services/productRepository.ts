/**
 * PATRÓN DE DISEÑO: Repository.
 *
 * La interfaz (páginas y hooks) nunca sabe de dónde vienen los datos: solo llama a estos métodos.
 * Hay dos implementaciones intercambiables:
 *
 *  - repositorioApi:     habla con los microservicios Spring Boot por HTTP (la real).
 *      · Vitrina pública → microservicio CATÁLOGO   (GET /productos, sin sesión)
 *      · CRUD de admin   → microservicio INVENTARIO (GET/POST/PUT/DELETE /productos, con JWT de ADMIN)
 *  - repositorioMemoria: datos de ejemplo en memoria (pruebas y modo demo sin backend).
 */
import { seedProducts } from '../data/seedProducts';
import type { Product } from '../types/product';
import { API, usarDatosEnMemoria } from './config';
import { ApiError, apiFetch } from './http';

export interface ProductRepository {
  /** Vitrina pública (sin precio de compra). */
  getCatalogo(): Promise<Product[]>;
  getDetalle(codigo: string): Promise<Product | undefined>;
  /** Administración (requiere rol ADMIN). */
  getAll(): Promise<Product[]>;
  getById(codigo: string): Promise<Product | undefined>;
  create(product: Product): Promise<Product>;
  update(codigo: string, changes: Partial<Omit<Product, 'codigo'>>): Promise<Product>;
  remove(codigo: string): Promise<boolean>;
}

// ----------------------------------------------------------------------------- API REST

/** Lo que devuelve el microservicio de catálogo (no trae precio de compra). */
interface ProductoCatalogoDTO {
  codigo: string;
  nombre: string;
  marca: string;
  categoria: string;
  subcategoria: string;
  unidad: string;
  precioVenta: number;
  imagen?: string;
  stock: number;
  stockMinimo: number;
  disponible: boolean;
  descripcion?: string;
}

const desdeCatalogo = (p: ProductoCatalogoDTO): Product => ({
  codigo: p.codigo,
  categoria: p.categoria,
  subcategoria: p.subcategoria,
  nombre: p.nombre,
  marca: p.marca,
  unidad: p.unidad,
  precioCompra: 0, // dato interno: el catálogo público no lo expone
  precioVenta: p.precioVenta,
  stock: p.stock,
  stockMinimo: p.stockMinimo,
  imagen: p.imagen,
  descripcion: p.descripcion,
});

/** 404 → undefined; cualquier otro error se propaga. */
async function oNoEncontrado<T>(promesa: Promise<T>): Promise<T | undefined> {
  try {
    return await promesa;
  } catch (e) {
    if (e instanceof ApiError && e.estado === 404) return undefined;
    throw e;
  }
}

export const repositorioApi: ProductRepository = {
  async getCatalogo() {
    const r = await apiFetch<{ total: number; productos: ProductoCatalogoDTO[] }>(`${API.catalogo}/productos`);
    return r.productos.map(desdeCatalogo);
  },

  async getDetalle(codigo) {
    const p = await oNoEncontrado(apiFetch<ProductoCatalogoDTO>(`${API.catalogo}/productos/${encodeURIComponent(codigo)}`));
    return p && desdeCatalogo(p);
  },

  async getAll() {
    const r = await apiFetch<{ total: number; productos: Product[] }>(`${API.inventario}/productos`, { auth: true });
    return r.productos;
  },

  getById(codigo) {
    return oNoEncontrado(apiFetch<Product>(`${API.inventario}/productos/${encodeURIComponent(codigo)}`, { auth: true }));
  },

  create(product) {
    return apiFetch<Product>(`${API.inventario}/productos`, { method: 'POST', body: product, auth: true });
  },

  async update(codigo, changes) {
    // PUT reemplaza el recurso completo: se combinan los datos actuales con los cambios
    const actual = await this.getById(codigo);
    if (!actual) throw new Error(`No existe un producto con el código ${codigo}`);
    return apiFetch<Product>(`${API.inventario}/productos/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      body: { ...actual, ...changes, codigo },
      auth: true,
    });
  },

  async remove(codigo) {
    const r = await oNoEncontrado(
      apiFetch<void>(`${API.inventario}/productos/${encodeURIComponent(codigo)}`, { method: 'DELETE', auth: true }).then(() => true),
    );
    return r ?? false;
  },
};

// ----------------------------------------------------------------------------- En memoria

const clone = (p: Product): Product => ({ ...p });
let products: Product[] = seedProducts.map(clone);

export const repositorioMemoria: ProductRepository & { reset(): void } = {
  async getCatalogo() {
    return products.map(clone);
  },
  async getDetalle(codigo) {
    return this.getById(codigo);
  },
  async getAll() {
    return products.map(clone);
  },
  async getById(codigo) {
    const found = products.find((p) => p.codigo === codigo);
    return found ? clone(found) : undefined;
  },
  async create(product) {
    if (products.some((p) => p.codigo === product.codigo)) {
      throw new Error(`Ya existe un producto con el código ${product.codigo}`);
    }
    products = [...products, clone(product)];
    return clone(product);
  },
  async update(codigo, changes) {
    const index = products.findIndex((p) => p.codigo === codigo);
    if (index === -1) throw new Error(`No existe un producto con el código ${codigo}`);
    const updated: Product = { ...products[index], ...changes, codigo };
    products = products.map((p, i) => (i === index ? updated : p));
    return clone(updated);
  },
  async remove(codigo) {
    const before = products.length;
    products = products.filter((p) => p.codigo !== codigo);
    return products.length < before;
  },
  reset() {
    products = seedProducts.map(clone);
  },
};

// ----------------------------------------------------------------------------- Fachada

const fuente = (): ProductRepository => (usarDatosEnMemoria ? repositorioMemoria : repositorioApi);

/** Punto de acceso que usa toda la app. */
export const productRepository = {
  getCatalogo: () => fuente().getCatalogo(),
  getDetalle: (codigo: string) => fuente().getDetalle(codigo),
  getAll: () => fuente().getAll(),
  getById: (codigo: string) => fuente().getById(codigo),
  create: (product: Product) => fuente().create(product),
  update: (codigo: string, changes: Partial<Omit<Product, 'codigo'>>) => fuente().update(codigo, changes),
  remove: (codigo: string) => fuente().remove(codigo),
  /** Restaura los datos de ejemplo (útil para las pruebas). */
  reset: () => repositorioMemoria.reset(),
};
