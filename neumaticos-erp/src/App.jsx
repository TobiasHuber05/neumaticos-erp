import { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
//Imports compras
import PedidosCompra from './components/ModuloCompras/PedidosCompra';
import NuevoPedidoForm from './components/Forms/NuevoPedidoForm';
import Proveedores from './components/ModuloCompras/Proveedores';
import Cotizaciones from './components/ModuloCompras/Cotizaciones';
import OrdenesCompra from './components/ModuloCompras/OrdenesCompra';
import PagosProveedores from './components/ModuloCompras/PagosProveedores';
import AsientosCompras from './components/ModuloCompras/AsientosCompras';
import Stock from './components/Stock';
import Services from './components/Services';

// Imports tesoreria
import Tesoreria from './components/Tesoreria';
import { useModuloTesoreria } from './hooks/useModuloTesoreria';
import GestionCuentas from './components/ModuloTesoreria/GestionCuentas';
import MovimientosBancarios from './components/ModuloTesoreria/MovimientosBancarios';
import ConciliacionBancaria from './components/ModuloTesoreria/ConciliacionBancaria';
import CuentaBancariaForm from './components/Forms/CuentaBancariaForm';

//Imports ventas
import Ventas from './components/Ventas';
import { useModuloVentas } from './hooks/useModuloVentas';
import Presupuestos from './components/ModuloVentas/Presupuestos';
import FacturasVentas from './components/ModuloVentas/FacturasVentas';
import NotasCreditoVentas from './components/ModuloVentas/NotasCreditoVentas';
import AsientosVentas from './components/ModuloVentas/AsientosVentas';
import ClientesVentas from './components/ModuloVentas/ClientesVentas';


import Personal from './components/Personal';
import { useModuloCompras } from './hooks/useModuloCompras';
import { ESTADOS_PEDIDO_COMPRA } from './components/Forms/comprasFormDefaults';

function App() {
  const compras = useModuloCompras();
  const [moduloActual, setModuloActual] = useState('compras');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormCuenta, setMostrarFormCuenta] = useState(false);

  const {
    MEDIOS_PAGO_PROVEEDOR,
    proveedores,
    setProveedores,
    inventario,
    setInventario,
    pedidos,
    pedidosCotizacion,
    cotizacionesProveedor,
    ordenesCompra,
    facturasProveedor,
    notasDevolucion,
    notasCreditoProveedor,
    ordenesPagoProveedores,
    asientosCompras,
    guardarPedidoCompra,
    generarPedidoCotizacion,
    actualizarCotizacionProveedor,
    adjudicarYGenerarOrdenes,
    registrarFacturaYStock,
    registrarNotaDevolucion,
    registrarNotaCreditoProveedor,
    registrarOrdenPago,
    productosBajoMinimo,
  } = compras;

  const { 
    cuentas, 
    bancos, 
    movimientos, 
    registrarCuenta, 
    registrarMovimiento, 
    confirmarMovimientos 
  } = useModuloTesoreria();

  const ventas = useModuloVentas();

  const proveedoresMaestro = useMemo(
    () => proveedores.map((p) => ({ id: p.id, nombre: p.nombre })),
    [proveedores],
  );


  const guardarNuevoPedido = (items) => {
    guardarPedidoCompra(items);
    setMostrarFormulario(false);
  };

  const pendientesCotizacion = pedidos.filter((p) => p.estado === ESTADOS_PEDIDO_COMPRA.PENDIENTE_COTIZACION).length;
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
      'presupuesto': 'Presupuestos',
      'clientes_ventas': 'Clientes',
      'notas credito': 'Notas de Crédito',
      'asiento ventas': 'Asientos de Ventas',
      tesoreria: 'Tesorería',
      'gestion_cuentas': 'Cuentas bancarias',
      'movimientos bancarios': 'Movimientos bancarios',
      'conciliacion bancaria': 'Conciliaciones bancarias',
      personal: 'Recursos Humanos',
    };
    return map[moduloActual] ?? moduloActual;
  };

  const renderContenido = () => {
    switch (moduloActual) {
      case 'proveedores':
        return <Proveedores proveedores={proveedores} setProveedores={setProveedores} />;
      case 'cotizaciones':
        return (
          <Cotizaciones
            pedidos={pedidos}
            proveedores={proveedores}
            pedidosCotizacion={pedidosCotizacion}
            cotizacionesProveedor={cotizacionesProveedor}
            generarPedidoCotizacion={generarPedidoCotizacion}
            actualizarCotizacionProveedor={actualizarCotizacionProveedor}
            adjudicarYGenerarOrdenes={adjudicarYGenerarOrdenes}
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
            mediosPago={MEDIOS_PAGO_PROVEEDOR}
            registrarOrdenPago={registrarOrdenPago}
          />
        );
      case 'asientos_compras':
        return <AsientosCompras asientos={asientosCompras} />;
      case 'stock':
        return (
          <Stock
            inventario={inventario}
            setInventario={setInventario}
            proveedoresMaestro={proveedoresMaestro}
          />
        );
      case 'servicios':
        return <Services />;
      case 'ventas':
        return (
          <Ventas 
            ventas={ventas}
            inventario={inventario}
            setInventario={setInventario}
          />
        );
      case 'facturas de venta':
        return <FacturasVentas ventas={ventas} clientes={ventas.clientes} inventario={inventario} setInventario={setInventario} />;
      case 'presupuesto':
        return <Presupuestos ventas={ventas} clientes={ventas.clientes} inventario={inventario} setInventario={setInventario} />;
      case 'notas credito':
        return <NotasCreditoVentas ventas={ventas} clientes={ventas.clientes} />;
      case 'asiento ventas':
        return <AsientosVentas ventas={ventas} />;
      case 'clientes_ventas':
        return <ClientesVentas ventas={ventas} />;

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
                  onCancelar={() => setMostrarFormCuenta(false)}
                  onGuardar={(nueva) => {
                    registrarCuenta(nueva);
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
            cuentas={cuentas}
            onCancelar={() => {}}
            onGuardar={registrarMovimiento}
          />
        );
      case 'conciliacion bancaria':
        return (
          <ConciliacionBancaria 
            movimientos={movimientos}
            cuentas={cuentas}
            onConfirmarConciliacion={confirmarMovimientos}
          />
        );
      case 'personal':
        return <Personal />;
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
            <h1 className="text-3xl font-black text-erp-orange uppercase tracking-tighter">{tituloModulo()}</h1>
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

export default App;
