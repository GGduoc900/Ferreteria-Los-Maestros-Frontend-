import { CLAVE_SESION } from '../services/sesion';
import type { Rol } from '../services/sesion';
import { crearTokenDePrueba } from '../utils/jwt';

/** Deja guardada una sesión (como si el usuario hubiera iniciado sesión antes de recargar). */
export function iniciarSesionDePrueba(rol: Rol = 'ADMIN', minutos = 60): string {
  const correo = rol === 'ADMIN' ? 'admin@ferreteria.cl' : 'cliente@ferreteria.cl';
  const nombre = rol === 'ADMIN' ? 'Administrador Los Maestros' : 'Cliente de Prueba';
  const token = crearTokenDePrueba({ sub: correo, rol, id: rol === 'ADMIN' ? 1 : 2, nombre }, minutos);
  localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario: { correo, nombre, rol } }));
  return token;
}
