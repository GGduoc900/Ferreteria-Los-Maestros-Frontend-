import type { CartItem, EstadoPedido, MetodoPago, Pedido } from '../types/cart';
import { usarDatosEnMemoria } from './config';
import { soloDigitos } from '../utils/pago';

/**
 * Pedidos y cobro.
 *
 * IMPORTANTE: el cobro está SIMULADO. No se contacta ninguna pasarela real y nunca se guarda el
 * número completo de la tarjeta ni el CVV (solo los últimos 4 dígitos).
 * Para cobrar de verdad, reemplaza el cuerpo de `pagarPedido` por la llamada a tu microservicio
 * de pagos (API.pagos) o a una pasarela como Webpay Plus / Mercado Pago, y registra la venta
 * en API.ventas. El resto de la interfaz no cambia.
 */

const CLAVE_PEDIDOS = 'lm_pedidos';

/** Número de prueba que simula un rechazo del banco (Luhn válido). */
export const TARJETA_RECHAZADA_DE_PRUEBA = '4000000000000002';

export interface DatosPago {
  nombre: string;
  correo: string;
  telefono: string;
  metodo: MetodoPago;
  numeroTarjeta?: string;
  cuotas?: number;
}

const leerPedidos = (): Pedido[] => {
  try {
    const data = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS) ?? '[]') as unknown;
    return Array.isArray(data) ? (data as Pedido[]) : [];
  } catch {
    return [];
  }
};

const guardarPedido = (p: Pedido) => {
  try {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify([p, ...leerPedidos()].slice(0, 50)));
  } catch { /* sin almacenamiento: el pedido igual se devuelve para mostrar la confirmación */ }
};

const generarNumero = (): string => {
  const d = new Date();
  const f = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `LM-${f}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function pagarPedido(items: CartItem[], datos: DatosPago): Promise<Pedido> {
  if (items.length === 0) throw new Error('El carrito está vacío.');
  if (!usarDatosEnMemoria) await esperar(1200); // simula la respuesta del banco

  const tarjeta = datos.metodo === 'credito' || datos.metodo === 'debito';
  const digitos = soloDigitos(datos.numeroTarjeta ?? '');
  if (tarjeta && digitos === TARJETA_RECHAZADA_DE_PRUEBA) {
    throw new Error('Tu banco rechazó el pago. Revisa los datos o prueba con otra tarjeta u otro método.');
  }

  const lineas = items.map((i) => ({
    codigo: i.product.codigo,
    nombre: i.product.nombre,
    marca: i.product.marca,
    precioUnitario: i.product.precioVenta,
    cantidad: i.cantidad,
    subtotal: i.product.precioVenta * i.cantidad,
  }));
  const estado: EstadoPedido = tarjeta ? 'PAGADO' : 'PENDIENTE_PAGO';

  const pedido: Pedido = {
    numero: generarNumero(),
    fecha: new Date().toISOString(),
    correoCliente: datos.correo.trim(),
    nombreCliente: datos.nombre.trim(),
    telefono: datos.telefono.trim(),
    lineas,
    total: lineas.reduce((s, l) => s + l.subtotal, 0),
    metodoPago: datos.metodo,
    tarjetaUltimos4: tarjeta ? digitos.slice(-4) : undefined,
    cuotas: datos.metodo === 'credito' ? datos.cuotas ?? 1 : undefined,
    estado,
  };
  guardarPedido(pedido);
  return pedido;
}

export const obtenerPedido = (numero: string): Pedido | undefined =>
  leerPedidos().find((p) => p.numero === numero);