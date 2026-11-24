import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/authService';
import {
  borrarSesion, CLAVE_SESION, EVENTO_SESION_EXPIRADA, guardarSesion, leerSesion,
} from '../services/sesion';
import type { Rol, Sesion, UsuarioSesion } from '../services/sesion';
import { decodificarJwt } from '../utils/jwt';

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  token: string | null;
  estaAutenticado: boolean;
  /** true si el usuario tiene alguno de los roles indicados. */
  tieneRol: (...roles: Rol[]) => boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<UsuarioSesion>;
  cerrarSesion: () => void;
  /** Aviso para mostrar cuando la sesión terminó sola (token vencido). */
  aviso: string | null;
  limpiarAviso: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MAX_TIMEOUT = 2_147_483_647; // límite de setTimeout (~24 días)

/**
 * Gestión de sesión del frontend.
 *
 * - Estado inicial: se lee de localStorage → la sesión SOBREVIVE a recargas de página.
 * - Al iniciar sesión se guarda el JWT; al cerrar se borra.
 * - Se programa un cierre automático en el instante en que vence el token (claim exp).
 * - Si cualquier llamada a la API responde 401, http.ts emite un evento y aquí se cierra la sesión.
 * - Si el usuario cierra sesión en otra pestaña, esta también se entera (evento "storage").
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());
  const [aviso, setAviso] = useState<string | null>(null);

  const terminar = useCallback((mensaje: string | null) => {
    borrarSesion();
    setSesion(null);
    setAviso(mensaje);
  }, []);

  // Cierre automático al vencer el token
  useEffect(() => {
    if (!sesion) return;
    const exp = decodificarJwt(sesion.token)?.exp;
    if (!exp) return;
    const restante = exp * 1000 - Date.now();
    const id = window.setTimeout(
      () => terminar('Tu sesión expiró. Inicia sesión nuevamente.'),
      Math.min(Math.max(restante, 0), MAX_TIMEOUT),
    );
    return () => window.clearTimeout(id);
  }, [sesion, terminar]);

  // 401 desde la API y sincronización entre pestañas
  useEffect(() => {
    const alExpirar = () => terminar('Tu sesión expiró. Inicia sesión nuevamente.');
    const alCambiarStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === CLAVE_SESION) setSesion(leerSesion());
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    window.addEventListener('storage', alCambiarStorage);
    return () => {
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
      window.removeEventListener('storage', alCambiarStorage);
    };
  }, [terminar]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const nueva = await authService.iniciarSesion(correo, contrasena);
    guardarSesion(nueva);
    setSesion(leerSesion() ?? nueva);
    setAviso(null);
    return nueva.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    authService.notificarCierreSesion();
    terminar(null);
  }, [terminar]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: sesion?.usuario ?? null,
      token: sesion?.token ?? null,
      estaAutenticado: Boolean(sesion),
      tieneRol: (...roles) => Boolean(sesion && roles.includes(sesion.usuario.rol)),
      iniciarSesion,
      cerrarSesion,
      aviso,
      limpiarAviso: () => setAviso(null),
    }),
    [sesion, aviso, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
