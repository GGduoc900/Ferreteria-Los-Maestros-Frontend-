import type { ContactosValues } from '../utils/Contactos';
import { API } from './config';
import { apiFetch } from './http';

export interface ContactoGuardado {
  mensaje: string;
  consulta: {
    id: number;
    nombre: string;
    correo?: string;
    asunto: string;
    mensaje: string;
    estado: string;
    fecha: string;
  };
}

/**
 * Envía el formulario al microservicio de notificaciones (POST /contacto, público),
 * que lo valida y lo guarda en su base de datos (tabla notificacion).
 */
export function enviarContacto(values: ContactosValues): Promise<ContactoGuardado> {
  return apiFetch<ContactoGuardado>(`${API.notificaciones}/contacto`, {
    method: 'POST',
    body: {
      nombre: values.nombre.trim(),
      correo: values.correo.trim() || null,
      asunto: 'Consulta desde el sitio web',
      mensaje: values.mensaje.trim(),
    },
  });
}
