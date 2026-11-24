import { Link } from 'react-router-dom';

export function AccesoDenegadoPage() {
  return (
    <div className="lm-panel text-center py-5">
      <h1 className="display-6">Acceso denegado</h1>
      <p>Tu cuenta no tiene permisos para ver esta sección.</p>
      <Link to="/" className="btn btn-primary">Ir al catálogo</Link>
    </div>
  );
}
