const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginValues {
  correo: string;
  contrasena: string;
}

export interface RegistroValues extends LoginValues {
  nombre: string;
  telefono: string;
  confirmacion: string;
}

export function validateLogin(v: LoginValues): Partial<Record<keyof LoginValues, string>> {
  const errors: Partial<Record<keyof LoginValues, string>> = {};
  if (!v.correo.trim()) errors.correo = 'El correo es obligatorio.';
  else if (!EMAIL_REGEX.test(v.correo.trim())) errors.correo = 'Ingresa un correo válido.';
  if (!v.contrasena) errors.contrasena = 'La contraseña es obligatoria.';
  return errors;
}

/** Mismas reglas que valida el microservicio de usuarios. */
export function validateRegistro(v: RegistroValues): Partial<Record<keyof RegistroValues, string>> {
  const errors: Partial<Record<keyof RegistroValues, string>> = validateLogin(v);
  if (!v.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
  if (v.contrasena && (v.contrasena.length < 8 || !/[A-Za-z]/.test(v.contrasena) || !/\d/.test(v.contrasena))) {
    errors.contrasena = 'Mínimo 8 caracteres, con letras y números.';
  }
  if (v.confirmacion !== v.contrasena) errors.confirmacion = 'Las contraseñas no coinciden.';
  return errors;
}
