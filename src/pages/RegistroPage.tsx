import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Button } from '../components/atoms/Button';
import { FormField } from '../components/molecules/FormField';
import { registrar } from '../services/authService';
import { validateRegistro } from '../utils/autenticacion';
import type { RegistroValues } from '../utils/autenticacion';

const VACIO: RegistroValues = { nombre: '', correo: '', telefono: '', contrasena: '', confirmacion: '' };

/** Registro público: el backend siempre crea la cuenta con rol CLIENTE. */
export function RegistroPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegistroValues>(VACIO);
  const [submitted, setSubmitted] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = validateRegistro(values);
  const show = (f: keyof RegistroValues) => (submitted ? errors[f] : undefined);
  const set = (f: keyof RegistroValues) => (value: string) => setValues((prev) => ({ ...prev, [f]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setEnviando(true);
    try {
      await registrar({
        nombre: values.nombre.trim(),
        correo: values.correo.trim(),
        telefono: values.telefono.trim() || undefined,
        contrasena: values.contrasena,
      });
      navigate('/login', { state: { registrado: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
      setEnviando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <form onSubmit={handleSubmit} noValidate aria-label="Registro" className="lm-panel p-4">
          <h1 className="h3 mb-3">Crear cuenta</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField id="reg-nombre" label="Nombre completo" value={values.nombre} error={show('nombre')} onChange={set('nombre')} />
          <FormField id="reg-correo" label="Correo" type="email" autoComplete="username" value={values.correo} error={show('correo')} onChange={set('correo')} />
          <FormField id="reg-telefono" label="Teléfono (opcional)" value={values.telefono} onChange={set('telefono')} />
          <FormField id="reg-contrasena" label="Contraseña" type="password" autoComplete="new-password" value={values.contrasena} error={show('contrasena')} onChange={set('contrasena')} />
          <FormField id="reg-confirmacion" label="Repite la contraseña" type="password" autoComplete="new-password" value={values.confirmacion} error={show('confirmacion')} onChange={set('confirmacion')} />
          <Button type="submit" disabled={enviando}>Crear cuenta</Button>
          <p className="small mt-3 mb-0">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </form>
      </div>
    </div>
  );
}
