import { decodificarJwt, tokenVencido } from '../utils/jwt';

export type Rol = 'ADMIN' | 'CLIENTE';

export interface UsuarioSesion {
  id?: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

/** Clave en localStorage: la sesión sobrevive a recargas de página y al cerrar la pestaña. */
export const CLAVE_SESION = 'lm_sesion';

/** Se emite cuando la API responde 401 (token vencido o inválido). Lo escucha AuthContext. */
export const EVENTO_SESION_EXPIRADA = 'lm:sesion-expirada';

/**
 * Lee la sesión guardada. Si está corrupta o el token ya venció, la borra y devuelve null.
 * Los datos del usuario se sacan del propio token (no de lo que diga el resto del JSON),
 * así no basta con editar localStorage para "cambiarse" de rol en la interfaz.
 */
export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const { token } = JSON.parse(crudo) as Partial<Sesion>;
    const payload = token ? decodificarJwt(token) : null;
    if (!token || !payload || tokenVencido(token)) {
      borrarSesion();
      return null;
    }
    return {
      token,
      usuario: { id: payload.id, nombre: payload.nombre ?? payload.sub, correo: payload.sub, rol: payload.rol },
    };
  } catch {
    borrarSesion();
    return null;
  }
}

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_SESION);
}
