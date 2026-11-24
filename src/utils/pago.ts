import type { MetodoPago } from '../types/cart';

export interface PagoValues {
  nombre: string;
  correo: string;
  telefono: string;
  metodo: MetodoPago | '';
  numeroTarjeta: string;
  titularTarjeta: string;
  vencimiento: string; // MM/AA
  cvv: string;
  cuotas: string;
}

export type PagoErrors = Partial<Record<keyof PagoValues, string>>;

export const esTarjeta = (m: MetodoPago | ''): m is 'credito' | 'debito' => m === 'credito' || m === 'debito';

export const soloDigitos = (v: string): string => v.replace(/\D/g, '');

export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'American Express' | null;

export function detectarMarca(numero: string): MarcaTarjeta {
  const n = soloDigitos(numero);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  return null;
}

/** Agrupa el número en bloques de 4 (Amex: 4-6-5). Máximo 16 dígitos (15 en Amex). */
export function formatearNumeroTarjeta(valor: string): string {
  const amex = detectarMarca(valor) === 'American Express';
  const n = soloDigitos(valor).slice(0, amex ? 15 : 16);
  if (amex) return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ');
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatearVencimiento(valor: string): string {
  const n = soloDigitos(valor).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

/** Algoritmo de Luhn: detecta números de tarjeta mal digitados. */
export function luhnValido(numero: string): boolean {
  const n = soloDigitos(numero);
  if (n.length < 13) return false;
  let suma = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  }
  return suma % 10 === 0;
}

export function vencimientoValido(valor: string, hoy = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  // Vence el último día del mes indicado
  return new Date(anio, mes, 0, 23, 59, 59) >= hoy;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarPago(v: PagoValues, hoy = new Date()): PagoErrors {
  const e: PagoErrors = {};

  if (v.nombre.trim().length < 3) e.nombre = 'Ingresa tu nombre completo.';
  if (!CORREO.test(v.correo.trim())) e.correo = 'Ingresa un correo válido.';
  const tel = soloDigitos(v.telefono);
  if (tel.length < 8 || tel.length > 12) e.telefono = 'Ingresa un teléfono válido (ej: +56 9 1234 5678).';

  if (!v.metodo) {
    e.metodo = 'Elige un método de pago.';
    return e;
  }

  if (esTarjeta(v.metodo)) {
    const n = soloDigitos(v.numeroTarjeta);
    if (!n) e.numeroTarjeta = 'Ingresa el número de la tarjeta.';
    else if (!luhnValido(n)) e.numeroTarjeta = 'El número de tarjeta no es válido.';

    if (v.titularTarjeta.trim().length < 3) e.titularTarjeta = 'Ingresa el nombre como aparece en la tarjeta.';

    if (!vencimientoValido(v.vencimiento, hoy)) e.vencimiento = 'Fecha inválida o vencida (MM/AA).';

    const largoCvv = detectarMarca(n) === 'American Express' ? 4 : 3;
    if (soloDigitos(v.cvv).length !== largoCvv || soloDigitos(v.cvv) !== v.cvv) {
      e.cvv = `El código de seguridad tiene ${largoCvv} dígitos.`;
    }
  }
  return e;
}