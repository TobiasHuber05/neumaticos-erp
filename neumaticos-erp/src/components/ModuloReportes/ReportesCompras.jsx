import React, { useState, useEffect } from 'react';
import { ShoppingCart, BarChart3, Filter, Download, DollarSign, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportesCompras } from '../../hooks/useReportesCompras';

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

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

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
      oc.fecha,
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
        <input 
          type="date"
          name="fechaDesde"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
          value={filtros.fechaDesde}
          onChange={handleFiltroChange}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
        <input 
          type="date"
          name="fechaHasta"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
          value={filtros.fechaHasta}
          onChange={handleFiltroChange}
        />
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
    switch(estado) {
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
          {ordenes.map((oc) => (
            <tr key={oc.id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-4 py-3 font-black text-gray-700">{oc.numero}</td>
              <td className="px-4 py-3 text-gray-600 font-medium">{oc.fecha}</td>
              <td className="px-4 py-3 font-bold text-gray-800">{oc.proveedor}</td>
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
          {ordenes.length === 0 && !loading && (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic font-medium">
                No se encontraron órdenes de compra con los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

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
    </div>
  );
};

export default ReportesCompras;
