import { Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './components/organisms/RutaProtegida';
import { MainLayout } from './components/templates/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AccesoDenegadoPage } from './pages/AccesoDenegadoPage';
import { AdminPage } from './pages/AdminPage';
import { CarritoPage } from './pages/CarritoPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { Contacto } from './pages/Contacto';
import { DondeEstamos } from './pages/DondeEstamos';
import { LoginPage } from './pages/LoginPage';
import { MiCuentaPage } from './pages/MiCuentaPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PedidoPage } from './pages/PedidoPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { RegistroPage } from './pages/RegistroPage';
import { SobreNosotros } from './pages/SobreNosotros';

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Públicas */}
          <Route path="/" element={<CatalogPage />} />
          <Route path="/producto/:codigo" element={<ProductDetailPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/nosotros" element={<SobreNosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/ubicacion" element={<DondeEstamos />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

          {/* Cualquier usuario con sesión */}
          <Route element={<RutaProtegida />}>
            <Route path="/mi-cuenta" element={<MiCuentaPage />} />
            <Route path="/pago" element={<CheckoutPage />} />
            <Route path="/pedido/:numero" element={<PedidoPage />} />
          </Route>

          {/* Solo ADMIN */}
          <Route element={<RutaProtegida roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/nuevo" element={<ProductFormPage />} />
            <Route path="/admin/editar/:codigo" element={<ProductFormPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </CartProvider>
    </AuthProvider>
  );
}