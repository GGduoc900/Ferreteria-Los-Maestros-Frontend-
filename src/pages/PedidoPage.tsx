import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/atoms/Alert';
import { Badge } from '../components/atoms/Badge';
import { datosTransferencia, HORAS_RESERVA, METODOS_PAGO } from '../data/pagos';
import { Info } from '../data/Info';
import { obtenerPedido } from '../services/pedidoService';
import { formatCLP } from '../utils/format';

/** Confirmación del pedido (comprobante). */
export function PedidoPage() {
  const { numero } = useParams<{ numero: string }>();
  const pedido = numero ? obtenerPedido(numero) : undefined;

  if (!pedido) {
    return (
      <>
        <Alert variant="danger">No encontramos ese pedido en este navegador.</Alert>
        <Link to="/" className="btn btn-outline-primary">Volver al catálogo</Link>
      </>
    );
  }

  const metodo = METODOS_PAGO.find((m) => m.id === pedido.metodoPago);
  const pagado = pedido.estado === 'PAGADO';

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="lm-panel p-4">
          <div className="text-center mb-3">
            <div style={{ fontSize: '3rem' }} aria-hidden="true">{pagado ? '✅' : '🕒'}</div>
            <h1 className="h3">{pagado ? '¡Pago realizado!' : 'Pedido recibido'}</h1>
            <p className="text-muted mb-1">Número de pedido</p>
            <p className="h4 mb-2" data-testid="numero-pedido">{pedido.numero}</p>
            <Badge variant={pagado ? 'success' : 'warning'}>{pagado ? 'Pagado' : 'Pendiente de pago'}</Badge>
          </div>

          <dl className="row small">
            <dt className="col-sm-4">Cliente</dt><dd className="col-sm-8">{pedido.nombreCliente} · {pedido.correoCliente}</dd>
            <dt className="col-sm-4">Fecha</dt><dd className="col-sm-8">{new Date(pedido.fecha).toLocaleString('es-CL')}</dd>
            <dt className="col-sm-4">Método de pago</dt>
            <dd className="col-sm-8">
              {metodo?.nombre}
              {pedido.tarjetaUltimos4 && ` terminada en ${pedido.tarjetaUltimos4}`}
              {pedido.cuotas && pedido.cuotas > 1 ? ` · ${pedido.cuotas} cuotas` : ''}
            </dd>
          </dl>

          <table className="table table-sm align-middle">
            <thead><tr><th>Producto</th><th className="text-end">Cant.</th><th className="text-end">Subtotal</th></tr></thead>
            <tbody>
              {pedido.lineas.map((l) => (
                <tr key={l.codigo}>
                  <td>{l.nombre}<div className="small text-muted">{l.codigo} · {formatCLP(l.precioUnitario)} c/u</div></td>
                  <td className="text-end">{l.cantidad}</td>
                  <td className="text-end">{formatCLP(l.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><th colSpan={2}>Total</th><th className="text-end">{formatCLP(pedido.total)}</th></tr></tfoot>
          </table>

          {pedido.metodoPago === 'transferencia' && (
            <Alert variant="info">
              Transfiere {formatCLP(pedido.total)} a {datosTransferencia.banco}, {datosTransferencia.tipoCuenta.toLowerCase()} {datosTransferencia.numeroCuenta}
              {' '}({datosTransferencia.titular}, RUT {datosTransferencia.rut}) indicando el pedido <strong>{pedido.numero}</strong> y
              envía el comprobante a {datosTransferencia.correoComprobante}. Reservado por {HORAS_RESERVA} horas.
            </Alert>
          )}
          {pedido.metodoPago === 'tienda' && (
            <Alert variant="info">
              Retira y paga tu pedido en {Info.direccion} dentro de {HORAS_RESERVA} horas, indicando el número <strong>{pedido.numero}</strong>.
            </Alert>
          )}

          <div className="d-flex gap-2 justify-content-center">
            <Link to="/" className="btn btn-primary">Seguir comprando</Link>
            <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  );
}