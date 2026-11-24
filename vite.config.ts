import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const MICROSERVICIOS: Record<string, number> = {
  inventario: 3001,
  catalogo: 3002,
  ventas: 3003,
  pagos: 3004,
  usuarios: 3005,
  notificaciones: 3006,
  proveedores: 3007,
};

const proxyMicroservicios = Object.fromEntries(
  Object.entries(MICROSERVICIOS).map(([servicio, puerto]) => [
    `/api/${servicio}`,
    {
      target: `http://localhost:${puerto}`,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(new RegExp(`^/api/${servicio}`), ''),
    },
  ]),
);

export default defineConfig({
  plugins: [react()],
  // Cada /api/<servicio>/... se redirige al puerto de su microservicio Spring Boot
  // (y se quita el prefijo). Ej.: /api/inventario/productos -> http://localhost:3001/productos
  server: { proxy: proxyMicroservicios },
  preview: { proxy: proxyMicroservicios },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Archivos excluidos del reporte (se justifican en docs/TESTING.md)
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/test/**',
        'src/tests/**',
        'src/types/**',
        'src/data/seedProducts.ts',
      ],
    },
  },
});
