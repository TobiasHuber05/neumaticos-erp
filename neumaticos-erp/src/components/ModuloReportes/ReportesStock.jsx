import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, Filter, Download, BarChart3 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportesStock } from '../../hooks/useReportesStock';
import Pagination, { usePagination } from '../ModuloCompras/Pagination';

const ReportesStock = () => {
  const { loading, getMovimientos, getKpis, getProductosLista } = useReportesStock();

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    productoId: '',
    tipoMovimiento: '',
  });

  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [kpis, setKpis] = useState({
    totalMovimientos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    productosAfectados: 0,
  });

  const pagination = usePagination(movimientos, 10);

  useEffect(() => {
    const cargarProductos = async () => {
      const data = await getProductosLista();
      setProductos(data);
    };
    cargarProductos();
  }, [getProductosLista]);

  useEffect(() => {
    const cargarDatos = async () => {
      const [movimientosData, kpisData] = await Promise.all([
        getMovimientos(filtros),
        getKpis(filtros),
      ]);
      setMovimientos(movimientosData);
      if (kpisData) setKpis(kpisData);
    };
    cargarDatos();
  }, [filtros, getMovimientos, getKpis]);

  // Texto visible en los inputs de fecha (dd/mm/aaaa)
  const [fechaDesdeText, setFechaDesdeText] = useState('');
  const [fechaHastaText, setFechaHastaText] = useState('');

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  // Convierte dd/mm/aaaa → aaaa-mm-dd (ISO) para la API
  const parseFechaTexto = (texto) => {
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    const [, dia, mes, anio] = match;
    const d = new Date(`${anio}-${mes}-${dia}`);
    if (isNaN(d.getTime())) return '';
    return `${anio}-${mes}-${dia}`;
  };

  // Auto-inserta las barras mientras el usuario escribe
  const formatearInputFecha = (valor) => {
    // Elimina todo lo que no sea número
    const solo = valor.replace(/\D/g, '').slice(0, 8);
    let resultado = solo;
    if (solo.length > 2) resultado = solo.slice(0, 2) + '/' + solo.slice(2);
    if (solo.length > 4) resultado = solo.slice(0, 2) + '/' + solo.slice(2, 4) + '/' + solo.slice(4);
    return resultado;
  };

  const handleFechaDesdeChange = (e) => {
    const formateado = formatearInputFecha(e.target.value);
    setFechaDesdeText(formateado);
    const iso = parseFechaTexto(formateado);
    setFiltros((prev) => ({ ...prev, fechaDesde: iso }));
  };

  const handleFechaHastaChange = (e) => {
    const formateado = formatearInputFecha(e.target.value);
    setFechaHastaText(formateado);
    const iso = parseFechaTexto(formateado);
    setFiltros((prev) => ({ ...prev, fechaHasta: iso }));
  };

  const limpiarFechaDesde = () => {
    setFechaDesdeText('');
    setFiltros((prev) => ({ ...prev, fechaDesde: '' }));
  };

  const limpiarFechaHasta = () => {
    setFechaHastaText('');
    setFiltros((prev) => ({ ...prev, fechaHasta: '' }));
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'Entrada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Salida':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Ajuste':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.text('NEUMÁTICOS ERP - HISTORIAL DE MOVIMIENTOS DE STOCK', 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de impresión: ${new Date().toLocaleString()}`, 14, 28);

    if (filtros.fechaDesde || filtros.fechaHasta) {
      doc.text(
        `Periodo: ${filtros.fechaDesde || 'Inicio'} al ${filtros.fechaHasta || 'Hoy'}`,
        14,
        34,
      );
    }

    const rows = movimientos.map((m) => [
      formatFecha(m.fecha),
      m.producto,
      m.tipo,
      m.cantidad,
      m.stockResultante,
      m.origen,
      m.descripcion || '—',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        ['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Stock Resultante', 'Origen', 'Descripción'],
      ],
      body: rows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`Reporte_Stock_${new Date().getTime()}.pdf`);
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
            name="fechaDesde"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="p-2 pr-8 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 w-[140px] font-mono"
            value={fechaDesdeText}
            onChange={handleFechaDesdeChange}
          />
          {fechaDesdeText && (
            <button
              type="button"
              onClick={limpiarFechaDesde}
              className="absolute right-2 text-gray-400 hover:text-red-400 text-xs font-black"
              title="Limpiar"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
        <div className="relative flex items-center">
          <input
            type="text"
            name="fechaHasta"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="p-2 pr-8 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 w-[140px] font-mono"
            value={fechaHastaText}
            onChange={handleFechaHastaChange}
          />
          {fechaHastaText && (
            <button
              type="button"
              onClick={limpiarFechaHasta}
              className="absolute right-2 text-gray-400 hover:text-red-400 text-xs font-black"
              title="Limpiar"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Producto</label>
        <select
          name="productoId"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 min-w-[220px]"
          value={filtros.productoId}
          onChange={handleFiltroChange}
        >
          <option value="">Todos los Productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
        <select
          name="tipoMovimiento"
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
          value={filtros.tipoMovimiento}
          onChange={handleFiltroChange}
        >
          <option value="">Todos los Tipos</option>
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
          <option value="Ajuste">Ajuste</option>
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
          <BarChart3 size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Movimientos Totales</p>
          <p className="text-xl font-black text-gray-800">{kpis.totalMovimientos}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-green-500">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Unidades Entradas</p>
          <p className="text-xl font-black text-gray-800">{kpis.totalEntradas}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <TrendingDown size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Unidades Salidas</p>
          <p className="text-xl font-black text-gray-800">{kpis.totalSalidas}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <Package size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Productos Afectados</p>
          <p className="text-xl font-black text-gray-800">{kpis.productosAfectados}</p>
        </div>
      </div>
    </div>
  );

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
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Producto</th>
            <th className="px-4 py-3 text-center">Tipo</th>
            <th className="px-4 py-3 text-right">Cantidad</th>
            <th className="px-4 py-3 text-right">Stock Resultante</th>
            <th className="px-4 py-3 text-left">Origen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {pagination.currentItems.map((m) => (
            <tr key={m.id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatFecha(m.fecha)}</td>
              <td className="px-4 py-3 font-mono text-gray-600">{m.producto}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${getBadgeColor(m.tipo)}`}
                >
                  {m.tipo}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-black text-gray-700">{m.cantidad}</td>
              <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">{m.stockResultante}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{m.descripcion || '—'}</td>
            </tr>
          ))}
          {pagination.currentItems.length === 0 && !loading && (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic font-medium">
                No se encontraron movimientos de stock con los filtros seleccionados.
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-orange-500 tracking-tight uppercase italic">
            Historial de Movimientos de Stock
          </h2>
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

export default ReportesStock;
