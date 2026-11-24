import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Button } from '../components/atoms/Button';
import { FormField } from '../components/molecules/FormField';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/autenticacion';
import type { LoginValues } from '../utils/autenticacion';

export function LoginPage() {
  const { iniciarSesion, estaAutenticado, usuario, aviso, limpiarAviso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;
  const registrado = (location.state as { registrado?: boolean } | null)?.registrado;

  const [values, setValues] = useState<LoginValues>({ correo: '', contrasena: '' });
  const [submitted, setSubmitted] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = validateLogin(values);
  const show = (f: keyof LoginValues) => (submitted ? errors[f] : undefined);
  const set = (f: keyof LoginValues) => (value: string) => {
    setError(null);
    setValues((prev) => ({ ...prev, [f]: value }));
  };

  // Si ya hay sesión (por ejemplo, tras recargar), no se muestra el formulario
  if (estaAutenticado && !enviando) {
    return <Navigate to={desde ?? (usuario?.rol === 'ADMIN' ? '/admin' : '/')} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setEnviando(true);
    try {
      const u = await iniciarSesion(values.correo, values.contrasena);
      navigate(desde ?? (u.rol === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setEnviando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-5">
        <form onSubmit={handleSubmit} noValidate aria-label="Inicio de sesión" className="lm-panel p-4">
          <h1 className="h3 mb-1">Iniciar sesión</h1>
          <p className="text-muted">Ingresa para administrar el inventario o revisar tu cuenta.</p>
          {aviso && (
            <Alert variant="warning">
              {aviso}{' '}
              <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={limpiarAviso}>Ocultar</button>
            </Alert>
          )}
          {desde && !aviso && <Alert variant="info">Debes iniciar sesión para continuar.</Alert>}
          {registrado && <Alert variant="success">Cuenta creada. Ya puedes iniciar sesión.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField id="login-correo" label="Correo" type="email" autoComplete="username" value={values.correo} error={show('correo')} onChange={set('correo')} placeholder="tucorreo@ejemplo.cl" />
          <FormField id="login-contrasena" label="Contraseña" type="password" autoComplete="current-password" value={values.contrasena} error={show('contrasena')} onChange={set('contrasena')} />
          <Button type="submit" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</Button>
          <p className="small mt-3 mb-0">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
          <details className="small text-muted mt-3">
            <summary>Cuentas de prueba</summary>
            ADMIN: admin@ferreteria.cl / Admin123!<br />
            CLIENTE: cliente@ferreteria.cl / Cliente123!
          </details>
        </form>
      </div>
    </div>
  );
}
