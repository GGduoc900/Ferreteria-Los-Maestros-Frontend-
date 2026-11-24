import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Rol } from '../../services/sesion';

interface RutaProtegidaProps {
  /** Roles permitidos. Si se omite, basta con haber iniciado sesión. */
  roles?: Rol[];
  children?: ReactNode;
}

/**
 * Guardia de rutas.
 * - Sin sesión → redirige a /login y recuerda a qué página quería ir (state.desde).
 * - Con sesión pero sin el rol → redirige a /acceso-denegado.
 * Es una restricción de INTERFAZ: la protección real está en el backend (JWT + roles).
 */
export function RutaProtegida({ roles, children }: RutaProtegidaProps) {
  const { estaAutenticado, tieneRol } = useAuth();
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (roles && !tieneRol(...roles)) {
    return <Navigate to="/acceso-denegado" replace />;
  }
  return <>{children ?? <Outlet />}</>;
}
