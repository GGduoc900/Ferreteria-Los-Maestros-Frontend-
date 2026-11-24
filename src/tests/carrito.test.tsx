import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { seedProducts } from '../data/seedProducts';
import { productRepository } from '../services/productRepository';
import {
  agregarItem, cambiarCantidad, cantidadTotal, leerCarritoGuardado, quitarItem, totalCarrito,
} from '../utils/cart';
import { luhnValido, validarPago, vencimientoValido } from '../utils/pago';
import { iniciarSesionDePrueba } from './sesionPrueba';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const conStock = seedProducts.filter((p) => p.stock > 2);

describe('Carrito: lógica', () => {
  const [a, b] = conStock;

  it('agrega, suma y no supera el stock disponible', () => {
    let c = agregarItem([], { ...a, stock: 3 }, 2);
    c = agregarItem(c, { ...a, stock: 3 }, 5);
    expect(c[0].cantidad).toBe(3);
  });

  it('no agrega productos sin stock', () => {
    expect(agregarItem([], { ...a, stock: 0 })).toHaveLength(0);
  });

  it('calcula total y cantidad; cantidad 0 quita el producto', () => {
    let c = agregarItem([], a, 2);
    c = agregarItem(c, b, 1);
    expect(totalCarrito(c)).toBe(a.precioVenta * 2 + b.precioVenta);
    expect(cantidadTotal(c)).toBe(3);
    c = cambiarCantidad(c, b.codigo, 0);
    expect(c).toHaveLength(1);
    expect(quitarItem(c, a.codigo)).toHaveLength(0);
  });

  it('ignora un carrito guardado corrupto', () => {
    expect(leerCarritoGuardado('no es json')).toEqual([]);
    expect(leerCarritoGuardado('[1,2]')).toEqual([]);
  });
});

describe('Pago: validaciones', () => {
  const hoy = new Date(2026, 10, 24);
  const base = {
    nombre: 'Ana Pérez', correo: 'ana@correo.cl', telefono: '+56 9 1234 5678', metodo: 'credito' as const,
    numeroTarjeta: '4242 4242 4242 4242', titularTarjeta: 'ANA PEREZ', vencimiento: '12/30', cvv: '123', cuotas: '1',
  };

  it('valida números de tarjeta con Luhn y fechas de vencimiento', () => {
    expect(luhnValido('4242424242424242')).toBe(true);
    expect(luhnValido('4242424242424241')).toBe(false);
    expect(vencimientoValido('11/26', hoy)).toBe(true);
    expect(vencimientoValido('10/26', hoy)).toBe(false);
  });

  it('acepta una tarjeta correcta y rechaza datos inválidos', () => {
    expect(validarPago(base, hoy)).toEqual({});
    expect(validarPago({ ...base, cvv: '12' }, hoy).cvv).toBeTruthy();
    expect(validarPago({ ...base, metodo: '' }, hoy).metodo).toBeTruthy();
  });

  it('transferencia y pago en tienda no piden datos de tarjeta', () => {
    expect(validarPago({ ...base, metodo: 'transferencia', numeroTarjeta: '', cvv: '' }, hoy)).toEqual({});
    expect(validarPago({ ...base, metodo: 'tienda', numeroTarjeta: '', cvv: '' }, hoy)).toEqual({});
  });
});

describe('Carrito y pago: flujo en la interfaz', () => {
  beforeEach(() => productRepository.reset());

  it('agregar desde el catálogo actualiza la insignia y aparece en el carrito', async () => {
    renderAt('/');
    const botones = await screen.findAllByRole('button', { name: /^Agregar .* al carrito$/ });
    await userEvent.click(botones[0]);
    expect(screen.getByRole('link', { name: 'Carrito, 1 producto' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Carrito, 1 producto' }));
    expect(await screen.findByRole('heading', { name: 'Carrito de compras' })).toBeInTheDocument();
    expect(screen.getByTestId('total-carrito')).toBeInTheDocument();
  });

  it('un carrito vacío muestra el mensaje y /pago redirige al carrito', async () => {
    iniciarSesionDePrueba('CLIENTE');
    renderAt('/pago');
    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('para pagar hay que iniciar sesión', async () => {
    renderAt('/pago');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('paga con transferencia, vacía el carrito y muestra la confirmación', async () => {
    iniciarSesionDePrueba('CLIENTE');
    renderAt('/');
    const botones = await screen.findAllByRole('button', { name: /^Agregar .* al carrito$/ });
    await userEvent.click(botones[0]);
    await userEvent.click(screen.getByRole('link', { name: 'Carrito, 1 producto' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Ir a pagar' }));

    await userEvent.type(await screen.findByLabelText('Teléfono'), '+56 9 1234 5678');
    await userEvent.click(screen.getByRole('radio', { name: /Transferencia bancaria/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    expect(await screen.findByTestId('numero-pedido')).toHaveTextContent(/^LM-\d{6}-\d{4}$/);
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carrito' })).toBeInTheDocument(); // sin insignia: carrito vacío
  });

  it('muestra errores si se intenta pagar con tarjeta sin completar los datos', async () => {
    iniciarSesionDePrueba('CLIENTE');
    renderAt('/');
    const botones = await screen.findAllByRole('button', { name: /^Agregar .* al carrito$/ });
    await userEvent.click(botones[0]);
    await userEvent.click(screen.getByRole('link', { name: 'Carrito, 1 producto' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Ir a pagar' }));

    await userEvent.click(await screen.findByRole('radio', { name: /Tarjeta de crédito/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Pagar / }));
    expect(await screen.findByText('Ingresa el número de la tarjeta.')).toBeInTheDocument();
  });
});