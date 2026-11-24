import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contacto } from '../pages/Contacto';
import { EMPTY_CONTACT, validateContact } from '../utils/Contactos';

const renderContacto = () =>
  render(
    <MemoryRouter>
      <Contacto />
    </MemoryRouter>,
  );

const okResponse = () =>
  Promise.resolve(new Response(JSON.stringify({ id: 1, estado: 'PENDIENTE' }), { status: 201 }));

describe('Contacto (formulario controlado + validación)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn(okResponse);
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('RENDERIZADO: muestra los datos de contacto de la ferretería', () => {
    renderContacto();
    expect(screen.getByRole('heading', { name: 'Contáctanos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contacto@losmaestros.cl' })).toHaveAttribute(
      'href',
      'mailto:contacto@losmaestros.cl',
    );
  });

  it('CONDICIONAL: al cargar no hay errores; al enviar vacío aparecen los obligatorios', async () => {
    renderContacto();
    expect(screen.queryByText('El nombre es obligatorio.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El mensaje es obligatorio.')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toHaveAttribute('aria-invalid', 'true');
  });

  it('CONDICIONAL: un correo inválido muestra error y no envía', async () => {
    renderContacto();
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Juan Pérez');
    await userEvent.type(screen.getByLabelText('Correo (opcional)'), 'juan@correo');
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(screen.queryByText(/¡Gracias!/)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('EVENTO + ESTADO: con datos válidos muestra éxito y limpia los campos', async () => {
    renderContacto();
    const nombre = screen.getByLabelText('Nombre completo');
    await userEvent.type(nombre, 'Juan Pérez');
    expect(nombre).toHaveValue('Juan Pérez');
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Necesito cotizar cemento');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('¡Gracias!');
    expect(nombre).toHaveValue('');
    // Llama al microservicio de notificaciones a través del proxy /api/notificaciones
    expect(fetchMock).toHaveBeenCalledWith('/api/notificaciones/contacto', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      nombre: 'Juan Pérez', correo: null, asunto: 'Consulta desde el sitio web', mensaje: 'Necesito cotizar cemento',
    });
  });

  it('ERROR: si el backend falla muestra un aviso y conserva lo escrito', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 500 })));
    renderContacto();
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana');
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(await screen.findByText(/No pudimos enviar tu mensaje/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana');
  });

  it('ESTADO: al volver a escribir se oculta el mensaje de éxito', async () => {
    renderContacto();
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana');
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(await screen.findByText(/¡Gracias!/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'B');
    expect(screen.queryByText(/¡Gracias!/)).not.toBeInTheDocument();
  });
});

describe('validateContact (lógica)', () => {
  const base = { ...EMPTY_CONTACT, nombre: 'Ana', mensaje: 'Hola' };

  it('datos mínimos válidos no producen errores (correo opcional)', () => {
    expect(validateContact(base)).toEqual({});
  });

  it('el correo, si viene, debe tener usuario, @, dominio y punto', () => {
    expect(validateContact({ ...base, correo: 'ana@correo' }).correo).toBe('Ingresa un correo válido.');
    expect(validateContact({ ...base, correo: 'ana@correo.cl' }).correo).toBeUndefined();
  });

  it('rechaza nombre de más de 100 y mensaje de más de 500 caracteres', () => {
    const errors = validateContact({ ...base, nombre: 'a'.repeat(101), mensaje: 'b'.repeat(501) });
    expect(errors.nombre).toMatch(/100 caracteres/);
    expect(errors.mensaje).toMatch(/500 caracteres/);
  });
});
