import { crearTokenDePrueba } from '../utils/jwt';
import { API, usarDatosEnMemoria } from './config';
import { ApiError, apiFetch } from './http';
import type { Rol, Sesion, UsuarioSesion } from './sesion';

/** Respuesta de POST /autenticacion/inicio-sesion (microservicio usuarios, puerto 3005). */
interface InicioSesionResponse {
  mensaje: string;
  tipo: 'Bearer';
  token: string;
  expiraEn: string;
  usuario: { id: number; nombre: string; correo: string; telefono?: string; rol: Rol; activo: boolean };
}

export interface RegistroDatos {
  nombre: string;
  correo: string;
  telefono?: string;
  contrasena: string;
}

/** Cuentas de prueba (las mismas que crea la migración V2 del microservicio usuarios). */
export const CUENTAS_DEMO = [
  { correo: 'admin@ferreteria.cl', contrasena: 'Admin123!', nombre: 'Administrador Los Maestros', rol: 'ADMIN' as Rol, id: 1 },
  { correo: 'cliente@ferreteria.cl', contrasena: 'Cliente123!', nombre: 'Cliente de Prueba', rol: 'CLIENTE' as Rol, id: 2 },
];

export async function iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
  if (usarDatosEnMemoria) {
    const cuenta = CUENTAS_DEMO.find((c) => c.correo === correo.trim().toLowerCase() && c.contrasena === contrasena);
    if (!cuenta) throw new ApiError(401, 'Correo o contraseña incorrectos');
    const usuario: UsuarioSesion = { id: cuenta.id, nombre: cuenta.nombre, correo: cuenta.correo, rol: cuenta.rol };
    return { token: crearTokenDePrueba({ sub: cuenta.correo, rol: cuenta.rol, id: cuenta.id, nombre: cuenta.nombre }), usuario };
  }
  const r = await apiFetch<InicioSesionResponse>(`${API.usuarios}/autenticacion/inicio-sesion`, {
    method: 'POST',
    body: { correo: correo.trim(), contrasena },
  });
  return {
    token: r.token,
    usuario: { id: r.usuario.id, nombre: r.usuario.nombre, correo: r.usuario.correo, rol: r.usuario.rol },
  };
}

export async function registrar(datos: RegistroDatos): Promise<void> {
  if (usarDatosEnMemoria) return;
  await apiFetch(`${API.usuarios}/autenticacion/registro`, { method: 'POST', body: datos });
}

/** Perfil del dueño del token (ruta protegida: cualquier usuario con sesión). */
export async function obtenerPerfil(): Promise<UsuarioSesion & { telefono?: string }> {
  return apiFetch(`${API.usuarios}/autenticacion/perfil`, { auth: true });
}

/** Avisa al backend (no es obligatorio: el JWT es sin estado y vence solo). */
export function notificarCierreSesion(): void {
  if (usarDatosEnMemoria) return;
  apiFetch(`${API.usuarios}/autenticacion/cierre-sesion`, { method: 'POST', auth: true }).catch(() => undefined);
}
