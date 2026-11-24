import { beforeEach, describe, expect, it } from 'vitest';
import { productRepository } from '../services/productRepository';
import type { Product } from '../types/product';

const nuevo: Product = {
  codigo: 'ZZ999', categoria: 'Varios', subcategoria: 'Prueba', nombre: 'Producto de prueba',
  marca: 'Test', unidad: 'Unidad', precioCompra: 100, precioVenta: 200, stock: 10, stockMinimo: 2,
};

// En pruebas el repositorio usa la implementación en memoria (misma interfaz async que la API)
describe('productRepository (CRUD)', () => {
  beforeEach(() => productRepository.reset());

  it('READ: getAll devuelve los 85 productos del catálogo', async () => {
    expect(await productRepository.getAll()).toHaveLength(85);
    expect(await productRepository.getCatalogo()).toHaveLength(85);
  });

  it('READ: getById devuelve el producto correcto y undefined si no existe', async () => {
    expect((await productRepository.getById('MC001'))?.nombre).toBe('Cemento Polpaico gris 25 kg');
    expect(await productRepository.getById('NOEXISTE')).toBeUndefined();
    expect(await productRepository.getDetalle('NOEXISTE')).toBeUndefined();
  });

  it('CREATE: agrega un producto y queda disponible', async () => {
    await productRepository.create(nuevo);
    expect(await productRepository.getAll()).toHaveLength(86);
    expect(await productRepository.getById('ZZ999')).toEqual(nuevo);
  });

  it('CREATE: lanza error si el código ya existe', async () => {
    await expect(productRepository.create({ ...nuevo, codigo: 'MC001' })).rejects.toThrow(/Ya existe/);
  });

  it('UPDATE: modifica solo los campos indicados', async () => {
    const updated = await productRepository.update('MC001', { stock: 5, precioVenta: 6500 });
    expect(updated.stock).toBe(5);
    const leido = await productRepository.getById('MC001');
    expect(leido?.precioVenta).toBe(6500);
    expect(leido?.nombre).toBe('Cemento Polpaico gris 25 kg');
  });

  it('UPDATE: lanza error si el producto no existe', async () => {
    await expect(productRepository.update('NOEXISTE', { stock: 1 })).rejects.toThrow(/No existe/);
  });

  it('DELETE: elimina el producto y devuelve true; false si no existía', async () => {
    expect(await productRepository.remove('MC001')).toBe(true);
    expect(await productRepository.getById('MC001')).toBeUndefined();
    expect(await productRepository.remove('MC001')).toBe(false);
  });
});
