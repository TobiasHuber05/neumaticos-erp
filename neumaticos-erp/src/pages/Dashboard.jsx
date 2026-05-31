import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import backgroundImage from '../assets/taller_pro.png';
import { puedeVer } from '../utils/permisos';

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

// Imports Reportes
import ReportesCompras from '../components/ModuloReportes/ReportesCompras';
import ReportesStock from '../components/ModuloReportes/ReportesStock';

// Imports Seguridad
import UsuariosModulo from '../components/Usuarios/UsuariosModulo';

// ── Hooks de API ──────────────────────────────────────
import { useProveedores } from '../hooks/useProveedores';
import { useProductos } from '../hooks/useProductos';
import { useCotizaciones } from '../hooks/useCotizaciones';
import { useOrdenesCompra } from '../hooks/useOrdenesCompra';
import { usePagosProveedores } from '../hooks/usePagosProveedores';
import { useTesoreria } from '../hooks/useTesoreria';
import { useMovimientosBancarios } from '../hooks/useMovimientosBancarios';
import { useConciliaciones } from '../hooks/useConciliaciones';
import { useCobranzas } from '../hooks/useCobranzas';

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
  const { inventario, categorias, marcas, eliminarProducto, refetch: refetchProductos } = useProductos();
  const productosBajoMinimo = () =>
    inventario.filter((p) => !p.esServicio && Number(p.stock) <= Number(p.min));

  const {
    cotizacionesProveedor,
    pedidosCotizacion,
    generarCotizacion,
    confirmarCotizacionConPocos,
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
  } = usePagosProveedores();

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

  const { mediosCobro, registrarCobro } = useCobranzas();

  // ── Estado local de pedidos (con API) ────────────────────
  const [pedidos, setPedidos] = useState([]);
  const [errorPedido, setErrorPedido] = useState(null);
  const [moduloActual, setModuloActual] = useState('inicio');
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

  useEffect(() => { fetchPedidos(); }, []);

  const compras = useModuloCompras();
  const {
    notasDevolucion,
    notasCreditoProveedor,
    registrarNotaDevolucion,
    registrarNotaCreditoProveedor,
  } = compras;

  const moduloVentas = useModuloVentas();
  const { servicios, actions: actionsServicios } = useServicios();

  const proveedoresMaestro = useMemo(
    () => proveedores.map((p) => ({ id: p.id, nombre: p.nombre })),
    [proveedores],
  );

  const guardarNuevoPedido = async (items) => {
    setErrorPedido(null);
    try {
      const res = await fetch(`${API_PEDIDOS}/pedidos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorPedido(err.error ?? 'Error al crear pedido');
        return;
      }
      await fetchPedidos();
      setMostrarFormulario(false);
    } catch {
      setErrorPedido('Error de conexión al crear el pedido');
    }
  };

  const editarPedido = async (id, items) => {
    try {
      const res = await fetch(`${API_PEDIDOS}/pedidos/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? 'Error al editar pedido');
        return;
      }
      await fetchPedidos();
    } catch {
      alert('Error de conexión al editar el pedido');
    }
  };

  const eliminarPedido = async (id) => {
    try {
      const res = await fetch(`${API_PEDIDOS}/pedidos/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? 'Error al eliminar pedido');
        return;
      }
      await fetchPedidos();
    } catch {
      alert('Error de conexión al eliminar el pedido');
    }
  };

  const registrarFacturaConRefetch = async (ordenCompra, payload) => {
    const res = await registrarFacturaYStock(ordenCompra, payload);
    if (res.ok) await refetchProductos();
    return res;
  };

  const generarPedidoCotizacion = async (pedido) => {
    const res = await generarCotizacion(pedido, proveedores);
    if (res.ok) await fetchPedidos();
    return res;
  };

  const confirmarCotizacionPocos = async (pedido, provsFiltrados) => {
    const res = await confirmarCotizacionConPocos(pedido, provsFiltrados);
    if (res.ok) await fetchPedidos();
    return res;
  };

  const adjudicarYGenerarOrdenesConRefetch = async (pc) => {
    const res = await adjudicarYGenerarOrdenes(pc);
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
      inicio: 'Panel de Inicio',
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
      reportes_compras: 'Reportes — Compras',
      reportes_stock: 'Reportes — Historial de Stock',
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
      usuarios: 'Gestión de Usuarios',
    };
    return map[moduloActual] ?? moduloActual;
  };


  const renderContenido = () => {
    switch (moduloActual) {
      case 'inicio':
        return (
          <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-10 overflow-hidden">
            {/* Imagen de fondo nítida y a pantalla completa */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-90 transform scale-100"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            ></div>

            {/* Overlay de luz blanca brillante */}
            <div className="absolute inset-0 bg-white/30 z-0"></div>

            <div className="relative z-10 max-w-4xl">
              <h2 className="text-8xl font-black text-orange-200 uppercase tracking-tighter mb-4 drop-shadow-xl">
                BIENVENIDO
              </h2>
              <p className="text-2xl text-gray-800 font-black mb-12 uppercase tracking-[0.3em] drop-shadow-sm">
                Neumáticos ERP
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Tarjeta Pedidos */}
                <div
                  className={`bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl border-b-8 border-erp-orange transition-all group
                    ${puedeVer('compras')
                      ? 'hover:translate-y-[-10px] cursor-pointer'
                      : 'opacity-80 cursor-not-allowed'}`}
                  onClick={() => puedeVer('compras') && setModuloActual('compras')}
                >
                  <h3 className="text-erp-orange font-black text-5xl mb-2 group-hover:scale-110 transition-transform">{pedidos.length}</h3>
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Pedidos Activos</p>
                </div>

                {/* Tarjeta Stock */}
                <div
                  className={`bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl border-b-8 border-blue-500 transition-all group
                    ${puedeVer('stock')
                      ? 'hover:translate-y-[-10px] cursor-pointer'
                      : 'opacity-80 cursor-not-allowed'}`}
                  onClick={() => puedeVer('stock') && setModuloActual('stock')}
                >
                  <h3 className="text-blue-500 font-black text-5xl mb-2 group-hover:scale-110 transition-transform">{inventario.length}</h3>
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Productos en Stock</p>
                </div>

                {/* Tarjeta Cuentas */}
                <div
                  className={`bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl border-b-8 border-green-500 transition-all group
                    ${puedeVer('tesoreria')
                      ? 'hover:translate-y-[-10px] cursor-pointer'
                      : 'opacity-80 cursor-not-allowed'}`}
                  onClick={() => puedeVer('tesoreria') && setModuloActual('gestion_cuentas')}
                >
                  <h3 className="text-green-500 font-black text-5xl mb-2 group-hover:scale-110 transition-transform">{cuentas.length}</h3>
                  <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Cuentas Bancarias</p>
                </div>
              </div>
            </div>
          </div>
        );

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
            confirmarCotizacionPocos={confirmarCotizacionPocos}
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
            registrarFacturaYStock={registrarFacturaConRefetch}
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
            cuentas={cuentas}
            registrarOrdenPago={registrarOrdenPago}
            onPagoRegistrado={async () => {
              await refetchFacturas();
              await refetchCuentas();
              await refetchMovimientos();
            }}
          />
        );

      case 'asientos_compras':
        return <AsientosCompras />;

      case 'stock':
        return <Stock proveedoresMaestro={proveedoresMaestro} onDelete={eliminarProducto} />;

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
            cuentas={cuentas}
            mediosCobro={mediosCobro}
            registrarCobro={registrarCobro}
            onCobroRegistrado={async () => {
              await moduloVentas.refetch();
              await refetchCuentas();
              await refetchMovimientos();
            }}
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
              onActualizar={async () => {
                await refetchCuentas();
                await refetchMovimientos();
              }}
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
            onConciliacionCompletada={async () => {
              await refetchMovimientos();
              await refetchCuentas();
              await refetchConciliaciones();
            }}
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
              inventario={inventario.filter(p => !p.esServicio)}
              sugeridos={productosBajoMinimo()}
              onCancelar={() => setMostrarFormulario(false)}
              onGuardarPedido={guardarNuevoPedido}
            />
          );
        }
        return (
          <>
            {errorPedido && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-3">
                {errorPedido}
              </div>
            )}
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
            <PedidosCompra
              onNuevoPedido={() => setMostrarFormulario(true)}
              pedidos={pedidos}
              inventario={inventario}
              onEditarPedido={editarPedido}
              onEliminarPedido={eliminarPedido}
            />
          </>
        );

      case 'reportes_compras':
        return <ReportesCompras />;
      case 'reportes_stock':
        return <ReportesStock />;
      case 'usuarios':
        return <UsuariosModulo />;

      default:
        return (
          <div className="bg-white p-20 rounded-xl border-4 border-dotted border-gray-100 text-center">
            <p className="text-gray-300 font-black uppercase text-xl">Módulo en desarrollo</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 relative overflow-hidden">
      {/* Imagen de fondo global con máxima nitidez (Igual al inicio) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.9] pointer-events-none fixed"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      {/* Capa de Brillo sutil (Igual al inicio) */}
      <div className="absolute inset-0 bg-white/30 z-0"></div>

      <div className="relative z-10 flex w-full h-full">
        <Sidebar setModulo={setModuloActual} moduloActual={moduloActual} />
        <main className={`flex-1 overflow-auto ${moduloActual === 'inicio' ? 'p-0' : 'p-10'} relative`}>
          {moduloActual !== 'inicio' && (
            <header className="mb-8 border-b-2 border-erp-yellow pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-erp-orange uppercase tracking-tighter">
                  {tituloModulo()}
                </h1>
              </div>
              <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-orange-100 text-right">
                <span className="block text-[9px] font-black text-erp-orange uppercase">Estado del sistema</span>
                <span className="text-xs font-bold text-green-500 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  ONLINE
                </span>
              </div>
            </header>
          )}
          {renderContenido()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;