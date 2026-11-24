import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Cargando } from '../components/atoms/Cargando';
import { ProductForm } from '../components/organisms/ProductForm';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product';
import { categoriasDe } from '../utils/filters';
import { productToFormValues } from '../utils/validation';

/** Sirve para crear (/admin/nuevo) y editar (/admin/editar/:codigo). Ruta protegida: solo ADMIN. */
export function ProductFormPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { products, loading, error: loadError, createProduct, updateProduct } = useProducts();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(codigo);
  const editing = codigo ? products.find((p) => p.codigo === codigo) : undefined;

  if (loading) return <Cargando texto="Cargando producto…" />;
  if (loadError) return <Alert variant="danger">No pudimos cargar el inventario: {loadError}</Alert>;
  if (isEditing && !editing) {
    return <Alert variant="danger">Producto no encontrado.</Alert>;
  }

  const handleSubmit = async (product: Product) => {
    setSaving(true);
    try {
      if (isEditing) {
        const { codigo: _ignored, ...changes } = product;
        await updateProduct(product.codigo, { ...changes, imagen: product.imagen });
        navigate('/admin', { state: { message: `Producto ${product.codigo} actualizado correctamente.` } });
      } else {
        await createProduct(product);
        navigate('/admin', { state: { message: `Producto ${product.codigo} creado correctamente.` } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="h3 mb-3">{isEditing ? `Editar producto ${codigo}` : 'Nuevo producto'}</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {saving && <Cargando texto="Guardando…" />}
      <ProductForm
        initialValues={editing ? productToFormValues(editing) : undefined}
        categories={categoriasDe(products)}
        existingCodes={products.map((p) => p.codigo)}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin')}
      />
    </>
  );
}
