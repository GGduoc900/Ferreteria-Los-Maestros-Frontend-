import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Cada prueba parte sin sesión guardada
afterEach(() => {
  localStorage.clear();
});
