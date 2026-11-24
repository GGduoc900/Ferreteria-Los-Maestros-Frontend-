/** Contenido (payload) del JWT que emite el microservicio de usuarios. */
export interface JwtPayload {
  sub: string; // correo
  rol: 'ADMIN' | 'CLIENTE';
  id?: number;
  nombre?: string;
  exp: number; // segundos desde 1970
  iat?: number;
  iss?: string;
}

/**
 * Lee el payload del JWT (la parte central, en Base64URL).
 * OJO: esto NO verifica la firma; solo sirve para mostrar datos y saber cuándo vence.
 * La verificación real la hace cada microservicio con la clave secreta.
 */
export function decodificarJwt(token: string): JwtPayload | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(relleno), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
    return typeof payload.exp === 'number' && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

/** true si el token no se puede leer o ya venció (con 5 s de margen). */
export function tokenVencido(token: string, ahora = Date.now()): boolean {
  const payload = decodificarJwt(token);
  return !payload || payload.exp * 1000 <= ahora + 5000;
}

/** Crea un token SIN firma válida, solo para pruebas y el modo demo en memoria. */
export function crearTokenDePrueba(datos: Omit<JwtPayload, 'exp'>, minutos = 120): string {
  const b64 = (o: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ ...datos, exp })}.demo`;
}
