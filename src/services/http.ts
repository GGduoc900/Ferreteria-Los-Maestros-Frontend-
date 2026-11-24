import { borrarSesion, EVENTO_SESION_EXPIRADA, leerSesion } from './sesion';

/** Error de la API con el código HTTP y el mensaje que envía el backend en { "error": "..." }. */
export class ApiError extends Error {
  constructor(public readonly estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
  }
}

interface Opciones {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** true = adjunta el JWT de la sesión en el header Authorization. */
  auth?: boolean;
}

/**
 * Único punto por donde el frontend habla con los microservicios.
 * - Serializa el cuerpo a JSON.
 * - Agrega "Authorization: Bearer <token>" en las rutas protegidas.
 * - Si el backend responde 401, cierra la sesión local y avisa a la app (token vencido).
 * - Convierte las respuestas de error en ApiError con un mensaje legible.
 */
export async function apiFetch<T>(url: string, { method = 'GET', body, auth = false }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const sesion = leerSesion();
    if (sesion) headers.Authorization = `Bearer ${sesion.token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que los microservicios estén encendidos.');
  }

  if (res.status === 401 && auth) {
    borrarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
  }
  if (!res.ok) {
    let mensaje = res.status === 403 ? 'No tienes permisos para esta acción.' : `Error ${res.status} del servidor`;
    try {
      const datos = (await res.json()) as { error?: string };
      if (datos?.error) mensaje = datos.error;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, mensaje);
  }
  if (res.status === 204) return undefined as T;
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
