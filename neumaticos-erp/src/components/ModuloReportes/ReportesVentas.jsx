import React, { useState, useEffect } from 'react';
import { ShoppingBag, BarChart3, Filter, Download, DollarSign, Package, FileText, X, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportesVentas } from '../../hooks/useReportesVentas';
import Pagination, { usePagination } from '../ModuloCompras/Pagination';

const ReportesVentas = () => {
    const { loading, getFacturas, getKpis, getClientesLista } = useReportesVentas();

    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        clienteId: '',
        estadoCobro: ''
    });

    const [clientes, setClientes] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [kpis, setKpis] = useState({
        totalFacturado: 0,
        totalCobrado: 0,
        saldoPendiente: 0,
        cantidadFacturas: 0,
        cantidadItems: 0,
        promedioPorFactura: 0,
    });
    const [selectedFactura, setSelectedFactura] = useState(null);

    const pagination = usePagination(facturas, 10);

    // Cargar clientes al iniciar
    useEffect(() => {
        getClientesLista().then(setClientes);
    }, [getClientesLista]);

    // Recargar al cambiar filtros
    useEffect(() => {
        const cargar = async () => {
            const [facturasData, kpisData] = await Promise.all([
                getFacturas(filtros),
                getKpis(filtros),
            ]);
            setFacturas(facturasData);
            if (kpisData) setKpis(kpisData);
        };
        cargar();
    }, [filtros, getFacturas, getKpis]);

    const formatFecha = (f) => {
        if (!f || f === '—') return '—';
        const d = new Date(f);
        if (isNaN(d.getTime())) return f;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const fmt = (n) => Number(n || 0).toLocaleString('de-DE');

    const badgeCobro = (estado) => {
        const map = {
            Cobrada: 'bg-green-100 text-green-800',
            Parcial: 'bg-yellow-100 text-yellow-800',
            Pendiente: 'bg-red-100 text-red-800',
        };
        return map[estado] ?? 'bg-gray-100 text-gray-600';
    };

    // ── PDF ──────────────────────────────────────────────────────────────────────
    const exportarPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Reporte de Ventas', 14, 15);
        doc.setFontSize(9);
        doc.text(
            `Generado: ${new Date().toLocaleDateString('es-PY')}  |  Período: ${filtros.fechaDesde || '—'} → ${filtros.fechaHasta || '—'}`,
            14, 22
        );

        autoTable(doc, {
            startY: 28,
            head: [['N° Factura', 'Fecha', 'Cliente', 'Tipo', 'Items', 'Total Gs.', 'Cobrado Gs.', 'Saldo Gs.', 'Estado']],
            body: facturas.map((f) => [
                f.numero,
                formatFecha(f.fecha),
                f.cliente,
                f.contadoCredito,
                f.cantidadItems,
                fmt(f.total),
                fmt(f.totalCobrado),
                fmt(f.saldoPendiente),
                f.estadoCobro,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [234, 88, 12] },
        });

        doc.save(`reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="p-6 space-y-6">

            {/* Encabezado */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <ShoppingBag className="text-erp-orange" size={28} /> Reportes de Ventas
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={exportarPDF}
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                    { label: 'Total Facturado', value: `Gs. ${fmt(kpis.totalFacturado)}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Cobrado', value: `Gs. ${fmt(kpis.totalCobrado)}`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Saldo Pendiente', value: `Gs. ${fmt(kpis.saldoPendiente)}`, icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Facturas', value: kpis.cantidadFacturas, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Ítems Vendidos', value: fmt(kpis.cantidadItems), icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                            <Icon className={color} size={18} />
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
                        <p className="text-lg font-black text-gray-800 leading-tight">{value}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={16} className="text-erp-orange" />
                    <span className="font-black text-gray-700 text-sm uppercase tracking-wider">Filtros</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filtros.fechaDesde}
                            onChange={(e) => setFiltros((p) => ({ ...p, fechaDesde: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-erp-orange outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filtros.fechaHasta}
                            onChange={(e) => setFiltros((p) => ({ ...p, fechaHasta: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-erp-orange outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Cliente</label>
                        <select
                            value={filtros.clienteId}
                            onChange={(e) => setFiltros((p) => ({ ...p, clienteId: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-erp-orange outline-none"
                        >
                            <option value="">Todos</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Estado de cobro</label>
                        <select
                            value={filtros.estadoCobro}
                            onChange={(e) => setFiltros((p) => ({ ...p, estadoCobro: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-erp-orange outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="Cobrada">Cobrada</option>
                            <option value="Parcial">Parcial</option>
                            <option value="Pendiente">Pendiente</option>
                        </select>
                    </div>
                </div>
                {(filtros.fechaDesde || filtros.fechaHasta || filtros.clienteId || filtros.estadoCobro) && (
                    <button
                        onClick={() => setFiltros({ fechaDesde: '', fechaHasta: '', clienteId: '', estadoCobro: '' })}
                        className="mt-3 text-xs text-gray-500 hover:text-red-500 font-bold flex items-center gap-1 transition-colors"
                    >
                        <X size={12} /> Limpiar filtros
                    </button>
                )}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 font-bold">Cargando...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3">N° Factura</th>
                                        <th className="px-5 py-3">Fecha</th>
                                        <th className="px-5 py-3">Cliente</th>
                                        <th className="px-5 py-3">Tipo</th>
                                        <th className="px-5 py-3 text-right">Total</th>
                                        <th className="px-5 py-3 text-right">Cobrado</th>
                                        <th className="px-5 py-3 text-right">Saldo</th>
                                        <th className="px-5 py-3 text-center">Estado</th>
                                        <th className="px-5 py-3 text-center">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pagination.currentItems.map((f) => (
                                        <tr key={f.id} className="hover:bg-orange-50/30 transition-colors">
                                            <td className="px-5 py-3 font-bold text-gray-700">{f.numero}</td>
                                            <td className="px-5 py-3 text-gray-600">{formatFecha(f.fecha)}</td>
                                            <td className="px-5 py-3 text-gray-700 font-medium max-w-[180px] truncate">{f.cliente}</td>
                                            <td className="px-5 py-3 text-gray-600">{f.contadoCredito}</td>
                                            <td className="px-5 py-3 text-right font-bold text-gray-800">Gs. {fmt(f.total)}</td>
                                            <td className="px-5 py-3 text-right text-green-700 font-medium">Gs. {fmt(f.totalCobrado)}</td>
                                            <td className="px-5 py-3 text-right text-red-600 font-medium">
                                                {f.saldoPendiente > 0 ? `Gs. ${fmt(f.saldoPendiente)}` : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeCobro(f.estadoCobro)}`}>
                                                    {f.estadoCobro}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedFactura(f)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pagination.currentItems.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-5 py-12 text-center text-gray-400 font-medium">
                                                No se encontraron facturas con los filtros aplicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.setCurrentPage}
                            totalItems={facturas.length}
                            itemsPerPage={10}
                        />
                    </>
                )}
            </div>

            {/* Modal detalle factura */}
            {selectedFactura && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-black text-gray-800">{selectedFactura.numero}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {formatFecha(selectedFactura.fecha)} · {selectedFactura.cliente} · {selectedFactura.contadoCredito}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedFactura(null)}
                                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Resumen cobro */}
                        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-50">
                            {[
                                { label: 'Total', value: fmt(selectedFactura.total), color: 'text-gray-800' },
                                { label: 'Cobrado', value: fmt(selectedFactura.totalCobrado), color: 'text-green-700' },
                                { label: 'Saldo', value: fmt(selectedFactura.saldoPendiente), color: 'text-red-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
                                    <p className={`text-lg font-black ${color}`}>Gs. {value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tabla de ítems */}
                        <div className="p-6">
                            <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Ítems</h4>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Producto / Servicio</th>
                                        <th className="px-4 py-2 text-center">Cant.</th>
                                        <th className="px-4 py-2 text-right">P. Unit.</th>
                                        <th className="px-4 py-2 text-right">IVA %</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(selectedFactura.detalles || []).map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-2.5 font-medium text-gray-700">
                                                {d.nombreProducto}
                                                {d.esServicio && (
                                                    <span className="ml-2 text-[9px] bg-purple-100 text-purple-700 font-black px-1.5 py-0.5 rounded-full uppercase">Servicio</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-gray-600">{d.cantidad}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">Gs. {fmt(d.precioUnitario)}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{d.iva ?? 0}%</td>
                                            <td className="px-4 py-2.5 text-right font-bold text-gray-800">Gs. {fmt(d.total)}</td>
                                        </tr>
                                    ))}
                                    {(selectedFactura.detalles || []).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">Sin ítems registrados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesVentas;
