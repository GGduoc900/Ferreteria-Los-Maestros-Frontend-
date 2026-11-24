import type { MetodoPago } from '../types/cart';

export interface InfoMetodoPago {
  id: MetodoPago;
  nombre: string;
  descripcion: string;
  icono: string;
}

export const METODOS_PAGO: InfoMetodoPago[] = [
  { id: 'credito', nombre: 'Tarjeta de crédito', descripcion: 'Visa, Mastercard o American Express. Hasta 12 cuotas.', icono: '💳' },
  { id: 'debito', nombre: 'Tarjeta de débito', descripcion: 'Redcompra y débito Visa/Mastercard.', icono: '🏦' },
  { id: 'transferencia', nombre: 'Transferencia bancaria', descripcion: 'Transfiere y envía el comprobante. Preparamos el pedido al confirmar el pago.', icono: '🔁' },
  { id: 'tienda', nombre: 'Pago en tienda', descripcion: 'Reserva tu pedido y paga en el local (efectivo o tarjeta) al retirarlo.', icono: '🏪' },
];

export const CUOTAS_DISPONIBLES = ['1', '2', '3', '6', '12'];

/** EJEMPLO: reemplazar por los datos reales de la cuenta de la ferretería. */
export const datosTransferencia = {
  banco: 'Banco de Chile',
  tipoCuenta: 'Cuenta corriente',
  numeroCuenta: '000-00000-00',
  titular: 'Ferretería Los Maestros SpA',
  rut: '76.000.000-0',
  correoComprobante: 'pagos@losmaestros.cl',
};

/** Horas que se mantiene reservado un pedido pendiente de pago. */
export const HORAS_RESERVA = 48;