/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Prefijo opcional si la API se publica detrás de un gateway (por defecto se usa el proxy de Vite). */
  readonly VITE_API_URL?: string;
  /** "memoria" = usa los datos de ejemplo sin backend (modo demo). */
  readonly VITE_FUENTE_DATOS?: string;
}
