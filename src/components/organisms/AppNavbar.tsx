import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export function AppNavbar() {
  const [open, setOpen] = useState(false);
  const { usuario, tieneRol, cerrarSesion } = useAuth();
  const { cantidad } = useCart();
  const navigate = useNavigate();

  const close = () => setOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' active' : ''}`;

  return (
    <nav className="navbar navbar-expand-md navbar-dark lm-navbar">
      <div className="container">
        <Link to="/" className="navbar-brand" onClick={close}>
          <img src="/logo.svg" alt="" className="brand-logo" />
          <span>
            Ferretería <strong>Los Maestros</strong>
          </span>
        </Link>

        <button
          type="button"
          className="navbar-toggler"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse${open ? ' show' : ''}`}
          data-testid="menu"
        >
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={linkClass}
                onClick={close}
              >
                Catálogo
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/nosotros"
                className={linkClass}
                onClick={close}
              >
                Nosotros
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/contacto"
                className={linkClass}
                onClick={close}
              >
                Contacto
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/ubicacion"
                className={linkClass}
                onClick={close}
              >
                Ubicación
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/carrito"
                className={linkClass}
                onClick={close}
                aria-label={cantidad > 0 ? `Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}` : 'Carrito'}
              >
                🛒 Carrito
                {cantidad > 0 && <span className="badge rounded-pill lm-cart-badge ms-1">{cantidad}</span>}
              </NavLink>
            </li>

            {/* El enlace de administración solo existe para el rol ADMIN */}
            {tieneRol('ADMIN') && (
              <li className="nav-item">
                <NavLink to="/admin" className={linkClass} onClick={close}>
                  Administración
                </NavLink>
              </li>
            )}

            {usuario ? (
              <>
                <li className="nav-item">
                  <NavLink to="/mi-cuenta" className={linkClass} onClick={close} title={`${usuario.correo} (${usuario.rol})`}>
                    Mi cuenta
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm ms-md-2 mt-2 mt-md-0"
                    onClick={() => {
                      close();
                      cerrarSesion();
                      navigate('/');
                    }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink to="/login" className={linkClass} onClick={close}>
                  Iniciar sesión
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}