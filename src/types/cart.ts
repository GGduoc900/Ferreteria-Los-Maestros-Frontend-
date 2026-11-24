import type { Product } from './product';

export interface CartItem {
  product: Product;
  cantidad: number;
}

export type MetodoPago = 'credito' | 'debito' | 'transferencia' | 'tienda';

export type EstadoPedido = 'PAGADO' | 'PENDIENTE_PAGO';

export interface LineaPedido {
  codigo: string;
  nombre: string;
  marca: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  numero: string;
  fecha: string; // ISO
  correoCliente: string;
  nombreCliente: string;
  telefono: string;
  lineas: LineaPedido[];
  total: number;
  metodoPago: MetodoPago;
  /** Solo para tarjetas: últimos 4 dígitos (nunca se guarda el número completo ni el CVV). */
  tarjetaUltimos4?: string;
  cuotas?: number;
  estado: EstadoPedido;
}