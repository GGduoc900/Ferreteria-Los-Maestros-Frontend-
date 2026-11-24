import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Badge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';
import { useAuth } from '../context/AuthContext';
import { obtenerPerfil } from '../services/authService';
import { usarDatosEnMemoria } from '../services/config';
import { decodificarJwt } from '../utils/jwt';

/** Ruta protegida para cualquier usuario con sesión (CLIENTE o ADMIN). */
export function MiCuentaPage() {
  const { usuario, token, cerrarSesion } = useAuth();
  const [telefono, setTelefono] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usarDatosEnMemoria) return;
    // Consulta un endpoint protegido: demuestra que el backend acepta el JWT
    obtenerPerfil()
      .then((p) => setTelefono(p.telefono))
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil.'));
  }, []);

  if (!usuario || !token) return null;
  const exp = decodificarJwt(token)?.exp;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-7">
        <div className="lm-panel p-4">
          <h1 className="h3">Mi cuenta</h1>
          {error && <Alert variant="warning">{error}</Alert>}
          <dl className="row mb-3">
            <dt className="col-sm-4">Nombre</dt><dd className="col-sm-8">{usuario.nombre}</dd>
            <dt className="col-sm-4">Correo</dt><dd className="col-sm-8">{usuario.correo}</dd>
            {telefono && (<><dt className="col-sm-4">Teléfono</dt><dd className="col-sm-8">{telefono}</dd></>)}
            <dt className="col-sm-4">Rol</dt>
            <dd className="col-sm-8"><Badge variant={usuario.rol === 'ADMIN' ? 'warning' : 'success'}>{usuario.rol}</Badge></dd>
            {exp && (<><dt className="col-sm-4">Sesión válida hasta</dt><dd className="col-sm-8">{new Date(exp * 1000).toLocaleString('es-CL')}</dd></>)}
          </dl>
          <div className="d-flex gap-2">
            {usuario.rol === 'ADMIN' && <Link to="/admin" className="btn btn-outline-primary">Ir a administración</Link>}
            <Button variant="outline-secondary" onClick={cerrarSesion}>Cerrar sesión</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
