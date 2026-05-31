import React, { useState, useEffect } from 'react';
import { ShoppingCart, BarChart3, Filter, Download, DollarSign, Package, FileText, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportesCompras } from '../../hooks/useReportesCompras';
import Pagination, { usePagination } from '../ModuloCompras/Pagination';

const ReportesCompras = () => {
  const { loading, getOrdenes, getKpis, getProveedoresLista } = useReportesCompras();

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    proveedorId: '',
    estadoPago: ''
  });

  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [kpis, setKpis] = useState({
    totalInversion: 0,
    cantidadOrdenes: 0,
    cantidadProductos: 0,
    promedioPorOC: 0,
    totalPagado: 0,
    saldoPendiente: 0
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  const pagination = usePagination(ordenes, 10);

  // Cargar proveedores al iniciar
  useEffect(() => {
    const cargarProv = async () => {
      const data = await getProveedoresLista();
      setProveedores(data);
    };
    cargarProv();
  }, [getProveedoresLista]);

  // Cargar datos al cambiar filtros
  useEffect(() => {
    const cargarDatos = async () => {
      const [ordenesData, kpisData] = await Promise.all([
        getOrdenes(filtros),
        getKpis(filtros)
      ]);
      setOrdenes(ordenesData);
      if (kpisData) setKpis(kpisData);
    };
    cargarDatos();
  }, [filtros, getOrdenes, getKpis]);

  const formatFecha = (fechaStr) => {
    if (!fechaStr || fechaStr === '—') return '—';
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const [fechaDesdeText, setFechaDesdeText] = useState('');
  const [fechaHastaText, setFechaHastaText] = useState('');

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const parseFechaTexto = (texto) => {
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    const [, dia, mes, anio] = match;
    const d = new Date(`${anio}-${mes}-${dia}`);
    if (isNaN(d.getTime())) return '';
    return `${anio}-${mes}-${dia}`;
  };

  const formatearInputFecha = (valor) => {
    const solo = valor.replace(/\D/g, '').slice(0, 8);
    let resultado = solo;
    if (solo.length > 2) resultado = solo.slice(0, 2) + '/' + solo.slice(2);
    if (solo.length > 4) resultado = solo.slice(0, 2) + '/' + solo.slice(2, 4) + '/' + solo.slice(4);
    return resultado;
  };

  const handleFechaDesdeChange = (e) => {
    const formateado = formatearInputFecha(e.target.value);
    setFechaDesdeText(formateado);
    setFiltros(prev => ({ ...prev, fechaDesde: parseFechaTexto(formateado) }));
  };

  const handleFechaHastaChange = (e) => {
    const formateado = formatearInputFecha(e.target.value);
    setFechaHastaText(formateado);
    setFiltros(prev => ({ ...prev, fechaHasta: parseFechaTexto(formateado) }));
  };

  const limpiarFechaDesde = () => { setFechaDesdeText(''); setFiltros(prev => ({ ...prev, fechaDesde: '' })); };
  const limpiarFechaHasta = () => { setFechaHastaText(''); setFiltros(prev => ({ ...prev, fechaHasta: '' })); };

  const formatMonto = (monto) => new Intl.NumberFormat('es-PY').format(monto || 0);

  const handleExportarPDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.text('NEUMÁTICOS ERP - REPORTE DE COMPRAS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de impresión: ${new Date().toLocaleString()}`, 14, 28);

    if (filtros.fechaDesde || filtros.fechaHasta) {
      doc.text(`Periodo: ${filtros.fechaDesde || 'Inicio'} al ${filtros.fechaHasta || 'Hoy'}`, 14, 34);
    }

    const rows = ordenes.map(oc => [
      oc.numero,
      formatFecha(oc.fecha),
      oc.proveedor,
      oc.cantidadItems,
      formatMonto(oc.montoTotal),
      formatMonto(oc.totalPagado),
      formatMonto(oc.saldoPendiente),
      oc.estadoPago,
      oc.estadoEntrega
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Orden', 'Fecha', 'Proveedor', 'Items', 'Total', 'Pagado', 'Saldo', 'Est. Pago', 'Est. Entrega']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] } // orange-500
    });

    doc.save(`Reporte_Compras_${new Date().getTime()}.pdf`);
  };

  const renderFiltros = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-wrap items-end gap-4 mb-6">
      <div className="flex items-center gap-2 mb-2 w-full">
        <Filter size={18} className="text-erp-orange" />
        <span className="font-bold text-gray-700 text-sm">Filtros:</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="p-2 pr-8 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 w-[140px] font-mono"
            value={fechaDesdeText}
            onChange={handleFechaDesdeChange}
          />
          {fechaDesdeText && (
            <button type="button" onClick={limpiarFechaDesde}
              className="absolute right-2 text-gray-400 hover:text-red-400 text-xs font-black" title="Limpiar"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="p-2 pr-8 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 w-[140px] font-mono"
            value={fechaHastaText}
            onChange={handleFechaHastaChange}
          />
          {fechaHastaText && (
            <button type="button" onClick={limpiarFechaHasta}
              className="absolute right-2 text-gray-400 hover:text-red-400 text-xs font-black" title="Limpiar"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
        <select
          name="proveedorId"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 min-w-[200px]"
          value={filtros.proveedorId}
          onChange={handleFiltroChange}
        >
          <option value="">Todos los Proveedores</option>
          {proveedores.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Est. Pago</label>
        <select
          name="estadoPago"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
          value={filtros.estadoPago}
          onChange={handleFiltroChange}
        >
          <option value="">Todos los Estados</option>
          <option value="Pagada">Pagada</option>
          <option value="Parcial">Parcial</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Sin factura">Sin factura</option>
        </select>
      </div>

      <div className="ml-auto flex gap-2">
        <button
          onClick={handleExportarPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-black hover:bg-red-100 transition-all border border-red-200 h-[38px]"
          title="Descargar PDF"
        >
          <Download size={18} />
          <span className="text-xs">EXPORTAR</span>
        </button>
      </div>
    </div>
  );

  const renderKpis = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-blue-500">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <DollarSign size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Inversión Total</p>
          <p className="text-xl font-black text-gray-800">Gs. {formatMonto(kpis.totalInversion)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-green-500">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
          <ShoppingCart size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Órdenes Generadas</p>
          <p className="text-xl font-black text-gray-800">{kpis.cantidadOrdenes} <span className="text-sm font-normal text-gray-400">OCs</span></p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <Package size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Artículos Recibidos</p>
          <p className="text-xl font-black text-gray-800">{kpis.cantidadProductos} <span className="text-sm font-normal text-gray-400">unidades</span></p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <BarChart3 size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Saldo Pendiente</p>
          <p className="text-xl font-black text-gray-800">Gs. {formatMonto(kpis.saldoPendiente)}</p>
        </div>
      </div>
    </div>
  );

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'Pagada': return 'bg-green-100 text-green-700 border-green-200';
      case 'Parcial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Pendiente': return 'bg-red-100 text-red-700 border-red-200';
      case 'Cerrada': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pendiente entrega': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderTabla = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
      />
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-erp-orange uppercase text-[10px] font-black">
          <tr>
            <th className="px-4 py-3 text-left">Orden</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Proveedor</th>
            <th className="px-4 py-3 text-center">Items</th>
            <th className="px-4 py-3 text-right">Monto Total</th>
            <th className="px-4 py-3 text-right">Saldo</th>
            <th className="px-4 py-3 text-center">Est. Pago</th>
            <th className="px-4 py-3 text-center">Est. Entrega</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {pagination.currentItems.map((oc) => (
            <tr key={oc.id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setSelectedOrder(oc)}>
              <td className="px-4 py-3 font-mono text-gray-800">{oc.numero}</td>
              <td className="px-4 py-3 text-gray-800 font-mono">{formatFecha(oc.fecha)}</td>
              <td className="px-4 py-3 font-mono text-gray-800">{oc.proveedor}</td>
              <td className="px-4 py-3 text-center font-mono text-xs bg-gray-50">{oc.cantidadItems}</td>
              <td className="px-4 py-3 text-right font-black text-gray-800">Gs. {formatMonto(oc.montoTotal)}</td>
              <td className="px-4 py-3 text-right font-black text-red-600">
                {oc.saldoPendiente > 0 ? `Gs. ${formatMonto(oc.saldoPendiente)}` : '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${getBadgeColor(oc.estadoPago)}`}>
                  {oc.estadoPago}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${getBadgeColor(oc.estadoEntrega)}`}>
                  {oc.estadoEntrega}
                </span>
              </td>
            </tr>
          ))}
          {pagination.currentItems.length === 0 && !loading && (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic font-medium">
                No se encontraron órdenes de compra con los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
      />
    </div>
  );

  const renderDetalleModal = () => {
    if (!selectedOrder) return null;
    const oc = selectedOrder;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="text-erp-orange w-6 h-6" />
              <div>
                <h3 className="text-xl font-black text-gray-800">{oc.numero}</h3>
                <p className="text-sm text-gray-500">
                  {oc.proveedor} — {formatFecha(oc.fecha)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {oc.facturas.length === 0 && (
              <div className="text-center text-gray-400 italic font-medium py-8">
                Esta orden no tiene facturas registradas.
              </div>
            )}

            {oc.facturas.map((fac) => (
              <div key={fac.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Factura</p>
                    <p className="font-black text-gray-800">{fac.numero}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Timbrado</p>
                      <p className="font-mono text-gray-700">{fac.timbrado}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha</p>
                      <p className="font-mono text-gray-700">{formatFecha(fac.fecha)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Tipo</p>
                      <p className="font-mono text-gray-700">{fac.contadoCredito ?? '—'}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${getBadgeColor(fac.estadoPago)}`}>
                      {fac.estadoPago}
                    </span>
                  </div>
                </div>

                {fac.detalles && fac.detalles.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase text-xs">Producto</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase text-xs">Cant.</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">Precio Unit.</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">IVA</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fac.detalles.map((d, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{d.nombreProducto}</td>
                            <td className="px-4 py-3 text-center font-mono">{d.cantidad}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-600">Gs. {formatMonto(d.precioUnitario)}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-600">Gs. {formatMonto(d.iva)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">Gs. {formatMonto(d.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 border-t">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right font-bold text-erp-orange uppercase text-xs">Total Factura:</td>
                          <td className="px-4 py-3 text-right font-black text-lg text-gray-900">Gs. {formatMonto(fac.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {(!fac.detalles || fac.detalles.length === 0) && (
                  <div className="p-4 text-center text-gray-400 italic text-sm">
                    Sin detalle de productos en esta factura.
                  </div>
                )}

                <div className="px-4 py-3 bg-gray-50 border-t flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Pagado: </span>
                    <span className="font-black text-green-600">Gs. {formatMonto(fac.totalPagado)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Saldo: </span>
                    <span className="font-black text-red-600">Gs. {formatMonto(fac.saldoPendiente)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Items: </span>
              <span className="font-black text-gray-800">{oc.cantidadItems}</span>
              <span className="mx-3 text-gray-300">|</span>
              <span className="text-gray-500 font-bold uppercase text-[10px]">Total Órden: </span>
              <span className="font-black text-gray-800">Gs. {formatMonto(oc.montoTotal)}</span>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-erp-orange tracking-tight uppercase italic">
            Reporte de Compras
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            Análisis de Proveedores y Órdenes
          </p>
        </div>
      </div>

      {renderFiltros()}
      {renderKpis()}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-erp-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-erp-orange font-black animate-pulse">CARGANDO REPORTE...</p>
        </div>
      ) : (
        renderTabla()
      )}

      {renderDetalleModal()}
    </div>
  );
};

export default ReportesCompras;
