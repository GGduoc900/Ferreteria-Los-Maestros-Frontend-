/**
 * Rutas base de cada microservicio Spring Boot.
 *
 * En desarrollo el frontend llama a rutas relativas (/api/<servicio>/...) y el proxy de Vite las
 * redirige al puerto de cada microservicio (ver vite.config.ts). Así no hay problemas de CORS y
 * el frontend no necesita conocer los puertos.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const API = {
  inventario: `${BASE}/api/inventario`, // 3001
  catalogo: `${BASE}/api/catalogo`, // 3002
  ventas: `${BASE}/api/ventas`, // 3003
  pagos: `${BASE}/api/pagos`, // 3004
  usuarios: `${BASE}/api/usuarios`, // 3005
  notificaciones: `${BASE}/api/notificaciones`, // 3006
  proveedores: `${BASE}/api/proveedores`, // 3007
} as const;

/**
 * Las pruebas (Vitest) y el modo demo (VITE_FUENTE_DATOS=memoria) usan datos en memoria
 * en vez de la API, para funcionar sin los microservicios encendidos.
 */
export const usarDatosEnMemoria =
  import.meta.env.MODE === 'test' || import.meta.env.VITE_FUENTE_DATOS === 'memoria';
