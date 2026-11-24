import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { FormField } from '../components/molecules/FormField';
import { ResumenPedido } from '../components/molecules/ResumenPedido';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CUOTAS_DISPONIBLES, datosTransferencia, HORAS_RESERVA, METODOS_PAGO } from '../data/pagos';
import { pagarPedido } from '../services/pedidoService';
import { formatCLP } from '../utils/format';
import {
  detectarMarca, esTarjeta, formatearNumeroTarjeta, formatearVencimiento, soloDigitos, validarPago,
} from '../utils/pago';
import type { PagoErrors, PagoValues } from '../utils/pago';
import type { MetodoPago } from '../types/cart';

export function CheckoutPage() {
  const { items, total, vaciar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const finalizado = useRef(false); // evita redirigir a /carrito justo después de pagar

  const [values, setValues] = useState<PagoValues>({
    nombre: usuario?.nombre ?? '',
    correo: usuario?.correo ?? '',
    telefono: '',
    metodo: '',
    numeroTarjeta: '',
    titularTarjeta: '',
    vencimiento: '',
    cvv: '',
    cuotas: '1',
  });
  const [submitted, setSubmitted] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  if (items.length === 0 && !finalizado.current) return <Navigate to="/carrito" replace />;

  const errors: PagoErrors = validarPago(values);
  const show = (f: keyof PagoValues) => (submitted ? errors[f] : undefined);
  const set = (f: keyof PagoValues) => (value: string) => {
    setErrorPago(null);
    setValues((prev) => ({ ...prev, [f]: value }));
  };
  const elegirMetodo = (m: MetodoPago) => set('metodo')(m);

  const marca = detectarMarca(values.numeroTarjeta);
  const tarjeta = esTarjeta(values.metodo);
  const metodoElegido = METODOS_PAGO.find((m) => m.id === values.metodo);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !values.metodo) return;
    setProcesando(true);
    setErrorPago(null);
    try {
      const pedido = await pagarPedido(items, {
        nombre: values.nombre,
        correo: values.correo,
        telefono: values.telefono,
        metodo: values.metodo,
        numeroTarjeta: tarjeta ? values.numeroTarjeta : undefined,
        cuotas: values.metodo === 'credito' ? Number(values.cuotas) : undefined,
      });
      finalizado.current = true;
      vaciar();
      navigate(`/pedido/${pedido.numero}`, { replace: true });
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : 'No se pudo procesar el pago.');
      setProcesando(false);
    }
  };

  const textoBoton = procesando
    ? 'Procesando…'
    : values.metodo === 'transferencia' || values.metodo === 'tienda'
      ? 'Confirmar pedido'
      : `Pagar ${formatCLP(total)}`;

  return (
    <>
      <Link to="/carrito" className="btn btn-link px-0 mb-2">← Volver al carrito</Link>
      <h1 className="h3 mb-3">Pago</h1>
      <form onSubmit={handleSubmit} noValidate aria-label="Formulario de pago">
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <section className="lm-panel p-4 mb-4" aria-labelledby="t-datos">
              <h2 className="h5 mb-3" id="t-datos">1. Tus datos</h2>
              <FormField id="nombre" label="Nombre completo" value={values.nombre} onChange={set('nombre')} error={show('nombre')} autoComplete="name" />
              <div className="row">
                <div className="col-12 col-md-6">
                  <FormField id="correo" label="Correo" type="email" value={values.correo} onChange={set('correo')} error={show('correo')} autoComplete="email" />
                </div>
                <div className="col-12 col-md-6">
                  <FormField id="telefono" label="Teléfono" value={values.telefono} onChange={set('telefono')} error={show('telefono')} placeholder="+56 9 1234 5678" autoComplete="tel" />
                </div>
              </div>
            </section>

            <section className="lm-panel p-4" aria-labelledby="t-metodo">
              <h2 className="h5 mb-3" id="t-metodo">2. Método de pago</h2>
              <div role="radiogroup" aria-labelledby="t-metodo" className="d-grid gap-2">
                {METODOS_PAGO.map((m) => (
                  <label key={m.id} className={`lm-pay-option${values.metodo === m.id ? ' selected' : ''}`}>
                    <input
                      type="radio" name="metodo" value={m.id} className="form-check-input mt-0"
                      checked={values.metodo === m.id} onChange={() => elegirMetodo(m.id)}
                    />
                    <span className="lm-pay-icon" aria-hidden="true">{m.icono}</span>
                    <span>
                      <strong className="d-block">{m.nombre}</strong>
                      <small className="text-muted">{m.descripcion}</small>
                    </span>
                  </label>
                ))}
              </div>
              {show('metodo') && <div className="invalid-feedback d-block">{show('metodo')}</div>}

              {tarjeta && (
                <div className="mt-4" data-testid="datos-tarjeta">
                  <FormField
                    id="numeroTarjeta" label={`Número de tarjeta${marca ? ` (${marca})` : ''}`}
                    value={values.numeroTarjeta}
                    onChange={(v) => set('numeroTarjeta')(formatearNumeroTarjeta(v))}
                    error={show('numeroTarjeta')} placeholder="1234 5678 9012 3456" autoComplete="cc-number"
                  />
                  <FormField
                    id="titularTarjeta" label="Nombre del titular" value={values.titularTarjeta}
                    onChange={set('titularTarjeta')} error={show('titularTarjeta')} autoComplete="cc-name"
                  />
                  <div className="row">
                    <div className="col-6">
                      <FormField
                        id="vencimiento" label="Vencimiento" value={values.vencimiento} placeholder="MM/AA"
                        onChange={(v) => set('vencimiento')(formatearVencimiento(v))}
                        error={show('vencimiento')} autoComplete="cc-exp"
                      />
                    </div>
                    <div className="col-6">
                      <FormField
                        id="cvv" label="Código de seguridad (CVV)" value={values.cvv} placeholder="123"
                        onChange={(v) => set('cvv')(soloDigitos(v).slice(0, 4))}
                        error={show('cvv')} autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                  {values.metodo === 'credito' && (
                    <FormField
                      id="cuotas" label="Cuotas" value={values.cuotas} options={CUOTAS_DISPONIBLES}
                      onChange={(v) => set('cuotas')(v || '1')} placeholder="1"
                    />
                  )}
                  <small className="text-muted">
                    Tus datos de tarjeta no se guardan. Para probar: 4242 4242 4242 4242 (aprobada) o 4000 0000 0000 0002 (rechazada).
                  </small>
                </div>
              )}

              {values.metodo === 'transferencia' && (
                <Alert variant="info">
                  <strong>Datos para transferir</strong>
                  <dl className="row mb-2 mt-2 small">
                    <dt className="col-5">Banco</dt><dd className="col-7 mb-1">{datosTransferencia.banco}</dd>
                    <dt className="col-5">Tipo de cuenta</dt><dd className="col-7 mb-1">{datosTransferencia.tipoCuenta}</dd>
                    <dt className="col-5">N.º de cuenta</dt><dd className="col-7 mb-1">{datosTransferencia.numeroCuenta}</dd>
                    <dt className="col-5">Titular</dt><dd className="col-7 mb-1">{datosTransferencia.titular}</dd>
                    <dt className="col-5">RUT</dt><dd className="col-7 mb-1">{datosTransferencia.rut}</dd>
                  </dl>
                  <small>
                    Transfiere {formatCLP(total)} e indica el número de pedido en el comentario. Envía el comprobante a{' '}
                    {datosTransferencia.correoComprobante}. Tu pedido queda reservado por {HORAS_RESERVA} horas.
                  </small>
                </Alert>
              )}

              {values.metodo === 'tienda' && (
                <Alert variant="info">
                  Reservamos tu pedido por {HORAS_RESERVA} horas. Pagas al retirarlo en el local, en efectivo o con tarjeta.
                </Alert>
              )}
            </section>
          </div>

          <div className="col-12 col-lg-5">
            <aside className="lm-panel p-4 lm-sticky" aria-label="Resumen del pedido">
              <h2 className="h5 mb-3">Resumen</h2>
              <ResumenPedido items={items} total={total} />
              {metodoElegido && <p className="small text-muted mt-3 mb-0">Método: {metodoElegido.nombre}</p>}
              {errorPago && <div className="mt-3"><Alert variant="danger">{errorPago}</Alert></div>}
              {submitted && Object.keys(errors).length > 0 && (
                <div className="mt-3"><Alert variant="warning">Revisa los campos marcados en rojo.</Alert></div>
              )}
              <button type="submit" className="btn btn-primary w-100 mt-3" disabled={procesando}>{textoBoton}</button>
            </aside>
          </div>
        </div>
      </form>
    </>
  );
}