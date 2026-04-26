import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';

// Imports compras
import PedidosCompra from '../components/ModuloCompras/PedidosCompra';
import NuevoPedidoForm from '../components/Forms/NuevoPedidoForm';
import Proveedores from '../components/ModuloCompras/Proveedores';
import Cotizaciones from '../components/ModuloCompras/Cotizaciones';
import OrdenesCompra from '../components/ModuloCompras/OrdenesCompra';
import PagosProveedores from '../components/ModuloCompras/PagosProveedores';
import AsientosCompras from '../components/ModuloCompras/AsientosCompras';
import Stock from '../components/Stock';
import Services from '../components/Services';

// Imports tesoreria
import Tesoreria from '../components/Tesoreria';
import GestionCuentas from '../components/ModuloTesoreria/GestionCuentas';
import MovimientosBancarios from '../components/ModuloTesoreria/MovimientosBancarios';
import ConciliacionBancaria from '../components/ModuloTesoreria/ConciliacionBancaria';
import CuentaBancariaForm from '../components/Forms/CuentaBancariaForm';

// Imports ventas
import Ventas from '../components/Ventas';
import { useModuloVentas } from '../hooks/useModuloVentas';
import Presupuestos from '../components/ModuloVentas/Presupuestos';
import FacturasVentas from '../components/ModuloVentas/FacturasVentas';
import NotasCreditoVentas from '../components/ModuloVentas/NotasCreditoVentas';
import AsientosVentas from '../components/ModuloVentas/AsientosVentas';
import ClientesVentas from '../components/ModuloVentas/ClientesVentas';

import Personal from '../components/Personal';

// Imports contabilidad
import PeriodosContables from '../components/ModuloContabilidad/PeriodosContables';
import PlanCuentas from '../components/ModuloContabilidad/PlanCuentas';
import AsientosManuales from '../components/ModuloContabilidad/AsientosManuales';
import ReportesContables from '../components/ModuloContabilidad/ReportesContables';

// ── Hooks reales de API ──────────────────────────────────────
import { useProveedores } from '../hooks/useProveedores';
import { useProductos } from '../hooks/useProductos';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { useOrdenesCompra } from '../hooks/useOrdenesCompra';
import { usePagosProveedores } from '../hooks/usePagosProveedores';
import { useTesoreria } from '../hooks/useTesoreria';
import { useMovimientosBancarios } from '../hooks/useMovimientosBancarios';
import { useConciliaciones } from '../hooks/useConciliaciones';

// Hook local solo para lo que todavía no tiene backend
import { useModuloCompras } from '../hooks/useModuloCompras';
import { useServicios } from '../hooks/useServicios';
import { ESTADOS_PEDIDO_COMPRA } from '../components/Forms/comprasFormDefaults';

const API_PEDIDOS = '/api/compras';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

function Dashboard() {
  // ── Hooks de API ─────────────────────────────────────────
  const { proveedores } = useProveedores();

  const { inventario } = useProductos();

  const productosBajoMinimo = () =>
    inventario.filter((p) => Number(p.stock) <= Number(p.min));

  const {
    cotizacionesProveedor,
    pedidosCotizacion,
    generarCotizacion,
    actualizarCotizacionProveedor,
    adjudicarYGenerarOrdenes,
    refetch: refetchCotizaciones,
  } = useCotizaciones();

  const {
    ordenesCompra,
    facturasProveedor,
    registrarFacturaYStock,
    refetch: refetchOrdenes,
    refetchFacturas,
  } = useOrdenesCompra();

  const {
    ordenesPagoProveedores,
    mediosPago,
    registrarOrdenPago,
  } = usePagosProveedores({ onPagoRegistrado: refetchFacturas });

  // ── Tesorería desde API ───────────────────────────────────
  const {
    cuentas,
    bancos,
    monedas,
    registrarCuenta,
    refetchCuentas
  } = useTesoreria();

  const { 
    movimientos, 
    refetch: refetchMovimientos, 
    registrarMovimiento, 
    getEstadisticasTesoreria,
    confirmarMovimientos
  } = useMovimientosBancarios();

  const {
    conciliaciones,
    crearConciliacion,
    vincularMovimientos,
    finalizarConciliacion,
    getConciliacionById,
    refetch: refetchConciliaciones
  } = useConciliaciones();

  // ── Estado local de pedidos (con API) ────────────────────
  const [pedidos, setPedidos] = useState([]);
  const [moduloActual, setModuloActual] = useState('compras');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormCuenta, setMostrarFormCuenta] = useState(false);

  const fetchPedidos = async () => {
    try {
      const res = await fetch(`${API_PEDIDOS}/pedidos`, { headers: getHeaders() });
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    }
  };

  useMemo(() => { fetchPedidos(); }, []);

  // ── Hook local solo para notas de devolución y NC (sin backend aún) ──
  const compras = useModuloCompras();
  const {
    notasDevolucion,
    notasCreditoProveedor,
    asientosCompras,
    registrarNotaDevolucion,
    registrarNotaCreditoProveedor,
  } = compras;

  // ── Ventas y Servicios ────────────────────────────────────
  const moduloVentas = useModuloVentas();
  const { servicios, actions: actionsServicios } = useServicios();

  const proveedoresMaestro = useMemo(
    () => proveedores.map((p) => ({ id: p.id, nombre: p.nombre })),
    [proveedores],
  );

  const guardarNuevoPedido = async (items) => {
    try {
      const res = await fetch(`${API_PEDIDOS}/pedidos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Error al crear pedido');
      await fetchPedidos();
      setMostrarFormulario(false);
    } catch (err) {
      console.error('Error al guardar pedido:', err);
    }
  };

  const generarPedidoCotizacion = async (pedido) => {
    const res = await generarCotizacion(pedido, proveedores);
    if (res.ok) await fetchPedidos();
    return res;
  };

  const adjudicarYGenerarOrdenesConRefetch = async (pc) => {
    const res = await adjudicarYGenerarOrdenes(pc, pedidos);
    if (res.ok) {
      await fetchPedidos();
      await refetchCotizaciones();
      await refetchOrdenes();
    }
    return res;
  };

  const pendientesCotizacion = pedidos.filter(
    (p) => p.estado === ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION,
  ).length;
  const alertasStock = productosBajoMinimo().length;

  const tituloModulo = () => {
    const map = {
      compras: 'Pedidos de compra',
      proveedores: 'Proveedores',
      cotizaciones: 'Cotizaciones',
      ordenes_compra: 'Órdenes de compra',
      pagos_proveedores: 'Pagos a proveedores',
      asientos_compras: 'Asientos — Compras',
      stock: 'Stock / Existencias',
      servicios: 'Servicios',
      ventas: 'Ventas & Facturación',
      'facturas de venta': 'Facturas de Venta',
      presupuesto: 'Presupuestos',
      clientes_ventas: 'Clientes',
      'notas credito': 'Notas de Crédito',
      'asiento ventas': 'Asientos de Ventas',
      tesoreria: 'Tesorería',
      gestion_cuentas: 'Cuentas bancarias',
      'movimientos bancarios': 'Movimientos bancarios',
      'conciliacion bancaria': 'Conciliaciones bancarias',
      personal: 'Nómina — Funcionarios',
      personal_nomina: 'Procesamiento de Nómina',
      personal_asientos: 'Asientos de Nómina',
      contabilidad_plan: 'Contabilidad — Plan de Cuentas',
      contabilidad_asientos: 'Contabilidad — Asientos',
      contabilidad_periodos: 'Contabilidad — Periodos',
      contabilidad_reportes: 'Contabilidad — Informes',
    };
    return map[moduloActual] ?? moduloActual;
  };

  const renderContenido = () => {
    switch (moduloActual) {
      case 'proveedores':
        return <Proveedores />;

      case 'cotizaciones':
        return (
          <Cotizaciones
            pedidos={pedidos}
            proveedores={proveedores}
            pedidosCotizacion={pedidosCotizacion}
            cotizacionesProveedor={cotizacionesProveedor}
            generarPedidoCotizacion={generarPedidoCotizacion}
            actualizarCotizacionProveedor={actualizarCotizacionProveedor}
            adjudicarYGenerarOrdenes={adjudicarYGenerarOrdenesConRefetch}
          />
        );

      case 'ordenes_compra':
        return (
          <OrdenesCompra
            proveedores={proveedores}
            ordenesCompra={ordenesCompra}
            facturasProveedor={facturasProveedor}
            notasDevolucion={notasDevolucion}
            notasCreditoProveedor={notasCreditoProveedor}
            registrarFacturaYStock={registrarFacturaYStock}
            registrarNotaDevolucion={registrarNotaDevolucion}
            registrarNotaCreditoProveedor={registrarNotaCreditoProveedor}
          />
        );

      case 'pagos_proveedores':
        return (
          <PagosProveedores
            proveedores={proveedores}
            facturasProveedor={facturasProveedor}
            ordenesPagoProveedores={ordenesPagoProveedores}
            mediosPago={mediosPago}
            registrarOrdenPago={registrarOrdenPago}
            onPagoRegistrado={refetchFacturas}
          />
        );

      case 'asientos_compras':
        return <AsientosCompras asientos={asientosCompras} />;

      case 'stock':
        return <Stock proveedoresMaestro={proveedoresMaestro} />;

      case 'servicios':
        return <Services servicios={servicios} actions={actionsServicios} />;

      case 'ventas':
        return <Ventas ventas={moduloVentas} inventario={inventario} setInventario={() => { }} servicios={servicios} />;

      case 'facturas de venta':
        return (
          <FacturasVentas
            ventas={moduloVentas}
            clientes={moduloVentas.clientes}
            inventario={inventario}
            setInventario={() => { }}
          />
        );

      case 'presupuesto':
        return (
          <Presupuestos
            ventas={moduloVentas}
            clientes={moduloVentas.clientes}
            inventario={inventario}
            setInventario={() => { }}
            servicios={servicios}
          />
        );

      case 'notas credito':
        return <NotasCreditoVentas ventas={moduloVentas} clientes={moduloVentas.clientes} />;

      case 'asiento ventas':
        return <AsientosVentas ventas={moduloVentas} />;

      case 'clientes_ventas':
        return <ClientesVentas ventas={moduloVentas} />;

      case 'tesoreria':
        return <Tesoreria />;

      case 'gestion_cuentas':
        return (
          <>
            <GestionCuentas
              bancos={bancos}
              cuentas={cuentas}
              movimientos={movimientos}
              onNuevaCuenta={() => setMostrarFormCuenta(true)}
            />
            {mostrarFormCuenta && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <CuentaBancariaForm
                  bancos={bancos}
                  monedas={monedas}
                  onCancelar={() => setMostrarFormCuenta(false)}
                  onGuardar={async (nueva) => {
                    await registrarCuenta(nueva);
                    setMostrarFormCuenta(false);
                  }}
                />
              </div>
            )}
          </>
        );

      case 'movimientos bancarios':
        return (
          <MovimientosBancarios
            movimientos={movimientos}
            cuentas={cuentas}
            bancos={bancos}
            onCancelar={() => { }}
            onGuardar={async (nuevo) => {
              const res = await registrarMovimiento(nuevo);
              if (res.ok) await refetchCuentas();
              return res;
            }}
          />
        );

      case 'conciliacion bancaria':
        return (
          <ConciliacionBancaria
            movimientos={movimientos}
            cuentas={cuentas}
            conciliaciones={conciliaciones}
            onCrear={crearConciliacion}
            onVincular={vincularMovimientos}
            onFinalizar={finalizarConciliacion}
            onGetDetalle={getConciliacionById}
          />
        );

      case 'personal':
        return <Personal defaultTab="funcionarios" />;

      case 'personal_nomina':
        return <Personal defaultTab="nomina" />;

      case 'personal_asientos':
        return <Personal defaultTab="asientos" />;

      case 'contabilidad_periodos':
        return <PeriodosContables />;

      case 'contabilidad_plan':
        return <PlanCuentas />;

      case 'contabilidad_asientos':
        return <AsientosManuales />;

      case 'contabilidad_reportes':
        return <ReportesContables />;

      case 'compras':
        if (mostrarFormulario) {
          return (
            <NuevoPedidoForm
              inventario={inventario}
              sugeridos={productosBajoMinimo()}
              onCancelar={() => setMostrarFormulario(false)}
              onGuardarPedido={guardarNuevoPedido}
            />
          );
        }
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-erp-orange">
                <h3 className="font-bold text-gray-500 text-xs uppercase">Pedidos totales</h3>
                <p className="text-3xl font-black text-erp-orange mt-1">{pedidos.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-blue-500">
                <h3 className="font-bold text-gray-500 text-xs uppercase">Pendientes de cotización</h3>
                <p className="text-3xl font-black text-blue-500 mt-1">{pendientesCotizacion}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-erp-yellow">
                <h3 className="font-bold text-gray-500 text-xs uppercase">Alertas de stock</h3>
                <p className="text-3xl font-black text-erp-yellow mt-1">{alertasStock}</p>
              </div>
            </div>
            <PedidosCompra onNuevoPedido={() => setMostrarFormulario(true)} pedidos={pedidos} />
          </>
        );

      default:
        return (
          <div className="bg-white p-20 rounded-xl border-4 border-dotted border-gray-100 text-center">
            <p className="text-gray-300 font-black uppercase text-xl">Módulo en desarrollo</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-orange-50 font-sans text-gray-900">
      <Sidebar setModulo={setModuloActual} moduloActual={moduloActual} />
      <main className="flex-1 overflow-auto p-10">
        <header className="mb-8 border-b-2 border-erp-yellow pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-erp-orange uppercase tracking-tighter">
              {tituloModulo()}
            </h1>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-100 text-right">
            <span className="block text-[9px] font-black text-erp-orange uppercase">Estado del sistema</span>
            <span className="text-xs font-bold text-green-500 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ONLINE
            </span>
          </div>
        </header>
        {renderContenido()}
      </main>
    </div>
  );
}

export default Dashboard;