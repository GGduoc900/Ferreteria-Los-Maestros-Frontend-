import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Cargando } from '../components/atoms/Cargando';
import { ConfirmBox } from '../components/molecules/ConfirmBox';
import { SearchFilters } from '../components/molecules/SearchFilters';
import { ProductTable } from '../components/organisms/ProductTable';
import { useProducts } from '../hooks/useProducts';
import type { ProductFilters } from '../types/product';
import { categoriasDe, EMPTY_FILTERS, filterProducts } from '../utils/filters';

/** Ruta protegida: solo ADMIN (ver App.tsx). Los datos vienen del microservicio de inventario. */
export function AdminPage() {
  const location = useLocation();
  const { products, loading, error, deleteProduct } = useProducts();
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message ?? null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!pendingDelete) return;
    const codigo = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteProduct(codigo);
      setActionError(null);
      setMessage(`Producto ${codigo} eliminado correctamente.`);
    } catch (e) {
      setMessage(null);
      setActionError(e instanceof Error ? e.message : 'No se pudo eliminar el producto.');
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <span className="lm-eyebrow mb-1" style={{ background: "#fdeee0", color: "#c1600f" }}>Panel</span>
          <h1 className="h3 mb-0">Administración de productos</h1>
        </div>
        <Link to="/admin/nuevo" className="btn btn-primary">+ Nuevo producto</Link>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {pendingDelete && (
        <ConfirmBox
          message={`¿Seguro que quieres eliminar el producto ${pendingDelete}?`}
          onConfirm={handleConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <SearchFilters
        filters={filters}
        categories={categoriasDe(products)}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />
      {loading && <Cargando texto="Cargando inventario…" />}
      {error && <Alert variant="danger">No pudimos cargar el inventario: {error}</Alert>}
      {!loading && !error && <ProductTable products={filterProducts(products, filters)} onDelete={setPendingDelete} />}
    </>
  );
}
