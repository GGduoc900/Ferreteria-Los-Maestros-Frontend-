import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Rol } from '../../services/sesion';

/** Muestra su contenido solo si el usuario tiene alguno de los roles (botones, enlaces, etc.). */
export function SoloRol({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { tieneRol } = useAuth();
  return tieneRol(...roles) ? <>{children}</> : null;
}
