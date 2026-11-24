import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { apiFetch, ApiError } from '../services/http';
import { CLAVE_SESION, leerSesion } from '../services/sesion';
import { productRepository } from '../services/productRepository';
import { crearTokenDePrueba, decodificarJwt, tokenVencido } from '../utils/jwt';
import { validateLogin, validateRegistro } from '../utils/autenticacion';
import { iniciarSesionDePrueba } from './sesionPrueba';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  productRepository.reset();
});

describe('JWT en el frontend', () => {
  it('decodifica el payload (sub, rol, exp) de un token', () => {
    const token = crearTokenDePrueba({ sub: 'admin@ferreteria.cl', rol: 'ADMIN', nombre: 'Admin' });
    const payload = decodificarJwt(token);
    expect(payload?.sub).toBe('admin@ferreteria.cl');
    expect(payload?.rol).toBe('ADMIN');
    expect(tokenVencido(token)).toBe(false);
  });

  it('un token vencido o mal formado se considera inválido', () => {
    expect(tokenVencido(crearTokenDePrueba({ sub: 'a@b.cl', rol: 'CLIENTE' }, -1))).toBe(true);
    expect(tokenVencido('no-es-un-jwt')).toBe(true);
    expect(decodificarJwt('a.b.c')).toBeNull();
  });
});

describe('Persistencia de la sesión (IE3.3.2)', () => {
  it('la sesión guardada se recupera al recargar la página', () => {
    iniciarSesionDePrueba('ADMIN');
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('una sesión vencida guardada se descarta al cargar', () => {
    iniciarSesionDePrueba('ADMIN', -5);
    expect(leerSesion()).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('el rol se toma del token, no del JSON editable de localStorage', () => {
    const token = crearTokenDePrueba({ sub: 'cliente@ferreteria.cl', rol: 'CLIENTE' });
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario: { correo: 'x', nombre: 'x', rol: 'ADMIN' } }));
    expect(leerSesion()?.usuario.rol).toBe('CLIENTE');
  });

  it('iniciar sesión guarda el token y cerrar sesión lo borra', async () => {
    renderAt('/login');
    await userEvent.type(screen.getByLabelText('Correo'), 'admin@ferreteria.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    // ADMIN llega directo al panel
    expect(await screen.findByRole('heading', { name: 'Administración de productos' })).toBeInTheDocument();
    expect(leerSesion()?.usuario.rol).toBe('ADMIN');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('credenciales incorrectas muestran error y no crean sesión', async () => {
    renderAt('/login');
    await userEvent.type(screen.getByLabelText('Correo'), 'admin@ferreteria.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'equivocada');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
    expect(leerSesion()).toBeNull();
  });

  it('la sesión se cierra sola cuando vence el token', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    iniciarSesionDePrueba('CLIENTE', 1); // vence en 1 minuto
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });
});

describe('Restricciones de acceso en la interfaz (IE3.3.3)', () => {
  it('sin sesión, /admin redirige al login', async () => {
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByText('Debes iniciar sesión para continuar.')).toBeInTheDocument();
  });

  it('tras iniciar sesión vuelve a la página que pedía', async () => {
    renderAt('/admin/nuevo');
    await userEvent.type(await screen.findByLabelText('Correo'), 'admin@ferreteria.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('heading', { name: 'Nuevo producto' })).toBeInTheDocument();
  });

  it('un CLIENTE no puede entrar a /admin (acceso denegado)', async () => {
    iniciarSesionDePrueba('CLIENTE');
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it('el menú muestra "Administración" solo al ADMIN', () => {
    iniciarSesionDePrueba('CLIENTE');
    const { unmount } = renderAt('/');
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
    unmount();
    localStorage.clear();
    iniciarSesionDePrueba('ADMIN');
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Administración' })).toBeInTheDocument();
  });

  it('el botón "Editar producto" del detalle solo aparece para ADMIN', async () => {
    iniciarSesionDePrueba('CLIENTE');
    const { unmount } = renderAt('/producto/MC001');
    await screen.findByRole('heading', { name: 'Cemento Polpaico gris 25 kg' });
    expect(screen.queryByRole('link', { name: 'Editar producto' })).not.toBeInTheDocument();
    unmount();
    localStorage.clear();
    iniciarSesionDePrueba('ADMIN');
    renderAt('/producto/MC001');
    expect(await screen.findByRole('link', { name: 'Editar producto' })).toHaveAttribute('href', '/admin/editar/MC001');
  });

  it('/mi-cuenta requiere sesión pero acepta cualquier rol', async () => {
    iniciarSesionDePrueba('CLIENTE');
    renderAt('/mi-cuenta');
    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument();
    expect(screen.getByText('CLIENTE')).toBeInTheDocument();
  });
});

describe('Cliente HTTP (integración con la API REST)', () => {
  it('adjunta el JWT en Authorization cuando la ruta es protegida', async () => {
    const token = iniciarSesionDePrueba('ADMIN');
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/api/inventario/productos', { auth: true });
    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('no envía el token a rutas públicas', async () => {
    iniciarSesionDePrueba('ADMIN');
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/api/catalogo/productos');
    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('un 401 del backend borra la sesión y avisa a la app', async () => {
    iniciarSesionDePrueba('ADMIN');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"error":"Token vencido"}', { status: 401 }))));
    const escucha = vi.fn();
    window.addEventListener('lm:sesion-expirada', escucha);
    await expect(apiFetch('/api/inventario/productos', { auth: true })).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener('lm:sesion-expirada', escucha);
    expect(escucha).toHaveBeenCalledTimes(1);
    expect(leerSesion()).toBeNull();
  });

  it('usa el mensaje { error } que envía el backend', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"error":"Ya existe un producto con el código MC001"}', { status: 409 }))));
    await expect(apiFetch('/api/inventario/productos', { method: 'POST', body: {} })).rejects.toThrow(
      'Ya existe un producto con el código MC001',
    );
  });

  it('si el servidor está apagado muestra un mensaje claro', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(apiFetch('/api/catalogo/productos')).rejects.toThrow(/No se pudo conectar/);
  });
});

describe('Validaciones de login y registro', () => {
  it('login exige correo válido y contraseña', () => {
    expect(validateLogin({ correo: '', contrasena: '' })).toEqual({
      correo: 'El correo es obligatorio.',
      contrasena: 'La contraseña es obligatoria.',
    });
    expect(validateLogin({ correo: 'a@b.cl', contrasena: 'x' })).toEqual({});
  });

  it('registro exige contraseña segura y que coincida la confirmación', () => {
    const base = { nombre: 'Ana', correo: 'ana@correo.cl', telefono: '', contrasena: 'abc', confirmacion: 'abd' };
    const e = validateRegistro(base);
    expect(e.contrasena).toMatch(/8 caracteres/);
    expect(e.confirmacion).toBe('Las contraseñas no coinciden.');
    expect(validateRegistro({ ...base, contrasena: 'Segura123', confirmacion: 'Segura123' })).toEqual({});
  });
});
