# Ferretería Los Maestros – Evaluación Parcial 3 (DSY1104)

Frontend con **React + Vite + TypeScript**, Bootstrap, React Router y pruebas con Vitest + React Testing Library.
Se conecta a los **7 microservicios Spring Boot** (`microservicios-ferreteria`) mediante su API REST, con inicio de sesión JWT y rutas protegidas por rol.

## Cómo ejecutarlo en Visual Studio Code

Requisito: **Node.js 22.22 o superior (recomendado Node 24 LTS)**. Con versiones anteriores las pruebas fallan con `Cannot read properties of undefined (reading 'bind')` porque jsdom 30 lo exige (`node -v`).

Antes de `npm run dev`, enciende al menos los microservicios **usuarios (3005), inventario (3001), catálogo (3002) y notificaciones (3006)** (ver README del backend).

```bash
npm install        # instala dependencias
npm run dev        # abre la app en http://localhost:5173 (proxy /api → microservicios)
npm test           # ejecuta las pruebas
npm run report     # pruebas + cobertura + reporte JSON (carpetas coverage/ y reports/)
npm run build      # revisa tipos y genera la versión de producción
```

**Modo demo sin backend:** crea un archivo `.env.local` con `VITE_FUENTE_DATOS=memoria` y la app usará los 85 productos de ejemplo y las cuentas de prueba sin llamar a la API.

### Conexión con los microservicios

El navegador solo habla con Vite (`/api/<servicio>/...`) y Vite reenvía cada ruta al puerto de su microservicio quitando el prefijo (ver `vite.config.ts`):

| Prefijo | Microservicio | Se usa para |
|---|---|---|
| `/api/catalogo` → 3002 | catálogo | Catálogo y detalle públicos |
| `/api/inventario` → 3001 | inventario | CRUD de administración (JWT ADMIN) |
| `/api/usuarios` → 3005 | usuarios | Login, registro, perfil |
| `/api/notificaciones` → 3006 | notificaciones | Formulario de contacto |
| `/api/ventas`, `/api/pagos`, `/api/proveedores` | 3003, 3004, 3007 | Disponibles para futuras vistas |

### Sesión y roles

| Cuenta de prueba | Contraseña | Rol |
|---|---|---|
| `admin@ferreteria.cl` | `Admin123!` | ADMIN |
| `cliente@ferreteria.cl` | `Cliente123!` | CLIENTE |

- `AuthContext` guarda el JWT en `localStorage` → la sesión sigue activa al recargar. Al cargar se descarta si venció, y se cierra sola cuando llega su `exp`.
- `services/http.ts` agrega `Authorization: Bearer <token>` en las rutas protegidas y, ante un `401`, cierra la sesión.
- `RutaProtegida` bloquea `/admin/**` (solo ADMIN) y `/mi-cuenta` (cualquier sesión). El menú y el botón "Editar producto" se muestran solo al ADMIN (`SoloRol`).

## Rutas

| Ruta | Vista |
|---|---|
| `/` | Catálogo con filtros (texto, categoría, solo stock bajo) |
| `/producto/:codigo` | Detalle del producto (parámetro de ruta) |
| `/nosotros` | Sobre nosotros |
| `/contacto` | Formulario de contacto con validación |
| `/ubicacion` | Dirección, horarios y mapa |
| `/admin` | Tabla de administración (leer, eliminar con confirmación) |
| `/admin/nuevo` | Crear producto |
| `/admin/editar/:codigo` | Editar producto |
| `/login` · `/registro` | Inicio de sesión y registro (públicos) |
| `/mi-cuenta` | Perfil (requiere sesión) |
| `/acceso-denegado` | Se muestra si el rol no tiene permiso |

Las rutas `/admin/**` requieren rol **ADMIN**.

## Arquitectura

```
src/
  components/
    atoms/       Button, Badge, Alert, TextInput, SelectInput
    molecules/   FormField, SearchFilters, ProductCard, StockBadge, ConfirmBox
    organisms/   AppNavbar, ProductGrid, ProductTable, ProductForm
    templates/   MainLayout
  pages/         CatalogPage, ProductDetailPage, AdminPage, ProductFormPage, NotFoundPage,
                 SobreNosotros, Contacto, DondeEstamos
  context/       AuthContext.tsx        ← sesión (JWT) persistente, roles, cierre automático
  services/      productRepository.ts   ← patrón Repository: API REST (real) o memoria (pruebas/demo)
                 http.ts · config.ts    ← cliente HTTP con JWT y rutas de cada microservicio
                 authService.ts · sesion.ts · contactoService.ts
  hooks/         useProducts.ts         ← useCatalogo / useProducto / useProducts (async)
  utils/         validation, Contactos, filters, format, image
  data/          seedProducts.ts        ← 85 productos del Excel del caso
  tests/         pruebas unitarias y de integración
```

- **Atomic Design**: átomos → moléculas → organismos → plantilla → páginas. Ej.: `FormField` (molécula) compone `TextInput`/`SelectInput` (átomos) y `ProductForm` (organismo) compone varios `FormField`.
- **Patrón de diseño: Repository** (`productRepository.ts`). La interfaz solo llama a `getCatalogo`, `getDetalle`, `getAll`, `getById`, `create`, `update`, `remove`. Hay dos implementaciones con la misma interfaz: `repositorioApi` (microservicios) y `repositorioMemoria` (pruebas y modo demo).
- **Estado**: `useState` (hook `useProducts`, filtros, formularios controlados).
- **Responsividad**: grilla y navbar de Bootstrap (menú hamburguesa bajo 768 px, tabla con scroll horizontal).

## Fotos de productos
Incluye las 6 fotos de la Evaluación 1 (MC001–MC006). Guarda las fotos en `public/productos/` con el código como nombre (`MC001.jpg`). Se muestran solas en el catálogo, el detalle y la tabla de administración. Si falta una, aparece una imagen "Sin foto". También se puede indicar una URL o ruta en el campo *Foto del producto* del formulario.

## Pruebas

Ver `docs/TESTING.md`.
