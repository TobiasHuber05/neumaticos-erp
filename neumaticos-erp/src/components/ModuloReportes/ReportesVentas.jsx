import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, Download, DollarSign, Package, FileText, X, CheckCircle } from 'lucide-react';
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
            Cobrada: 'bg-green-100 text-green-700 border-green-200',
            Parcial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Pendiente: 'bg-red-100 text-red-700 border-red-200',
        };
        return map[estado] ?? 'bg-gray-100 text-gray-700 border-gray-200';
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
        <div className="space-y-6 animate-in fade-in duration-500">

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-orange-500 tracking-tight uppercase italic">
                        Reportes de Ventas
                    </h2>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-wrap items-end gap-4 mb-6">
                <div className="flex items-center gap-2 mb-2 w-full">
                    <Filter size={18} className="text-erp-orange" />
                    <span className="font-bold text-gray-700 text-sm">Filtros</span>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
                    <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(e) => setFiltros((p) => ({ ...p, fechaDesde: e.target.value }))}
                        className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
                    <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(e) => setFiltros((p) => ({ ...p, fechaHasta: e.target.value }))}
                        className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                    <select
                        value={filtros.clienteId}
                        onChange={(e) => setFiltros((p) => ({ ...p, clienteId: e.target.value }))}
                        className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 min-w-[200px]"
                    >
                        <option value="">Todos</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Estado de cobro</label>
                    <select
                        value={filtros.estadoCobro}
                        onChange={(e) => setFiltros((p) => ({ ...p, estadoCobro: e.target.value }))}
                        className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
                    >
                        <option value="">Todos</option>
                        <option value="Cobrada">Cobrada</option>
                        <option value="Parcial">Parcial</option>
                        <option value="Pendiente">Pendiente</option>
                    </select>
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={exportarPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-black hover:bg-red-100 transition-all border border-red-200 h-[38px]"
                        title="Descargar PDF"
                    >
                        <Download size={18} />
                        <span className="text-xs">EXPORTAR</span>
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

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 font-bold">Cargando...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-orange-50 text-erp-orange uppercase text-[10px] font-black">
                                    <tr>
                                        <th className="px-4 py-3 text-left">N° Factura</th>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-left">Cliente</th>
                                        <th className="px-4 py-3 text-left">Tipo</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-right">Cobrado</th>
                                        <th className="px-4 py-3 text-right">Saldo</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pagination.currentItems.map((f) => (
                                        <tr key={f.id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setSelectedFactura(f)}>
                                            <td className="px-4 py-3 font-mono text-gray-800">{f.numero}</td>
                                            <td className="px-4 py-3 text-gray-800 font-mono">{formatFecha(f.fecha)}</td>
                                            <td className="px-4 py-3 font-mono text-gray-800">{f.cliente}</td>
                                            <td className="px-4 py-3 font-mono text-gray-800">{f.contadoCredito}</td>
                                            <td className="px-4 py-3 text-right font-black text-gray-800">Gs. {fmt(f.total)}</td>
                                            <td className="px-4 py-3 text-right font-black text-green-700">Gs. {fmt(f.totalCobrado)}</td>
                                            <td className="px-4 py-3 text-right font-black text-red-600">
                                                {f.saldoPendiente > 0 ? `Gs. ${fmt(f.saldoPendiente)}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border ${badgeCobro(f.estadoCobro)}`}>
                                                    {f.estadoCobro}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {pagination.currentItems.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic font-medium">
                                                No se encontraron facturas con los filtros seleccionados.
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                <FileText className="text-erp-orange w-6 h-6" />
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">{selectedFactura.numero}</h3>
                                    <p className="text-sm text-gray-500">
                                        {formatFecha(selectedFactura.fecha)} — {selectedFactura.cliente} — {selectedFactura.contadoCredito}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFactura(null)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase text-xs">Producto / Servicio</th>
                                            <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase text-xs">Cant.</th>
                                            <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">P. Unit.</th>
                                            <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">IVA %</th>
                                            <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase text-xs">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(selectedFactura.detalles || []).map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {d.nombreProducto}
                                                    {d.esServicio && (
                                                        <span className="ml-2 text-[9px] bg-purple-100 text-purple-700 font-black px-1.5 py-0.5 rounded-full uppercase">Servicio</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono">{d.cantidad}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-600">Gs. {fmt(d.precioUnitario)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-600">{d.iva ?? 0}%</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">Gs. {fmt(d.total)}</td>
                                            </tr>
                                        ))}
                                        {(selectedFactura.detalles || []).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">Sin ítems registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-orange-50 border-t">
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-right font-bold text-erp-orange uppercase text-xs">Total Factura:</td>
                                            <td className="px-4 py-3 text-right font-black text-lg text-gray-900">Gs. {fmt(selectedFactura.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="px-4 py-3 bg-gray-50 rounded-lg border flex justify-between text-sm">
                                <div>
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Cobrado: </span>
                                    <span className="font-black text-green-600">Gs. {fmt(selectedFactura.totalCobrado)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Saldo: </span>
                                    <span className="font-black text-red-600">Gs. {fmt(selectedFactura.saldoPendiente)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm">
                                <span className="text-gray-500 font-bold uppercase text-[10px]">Items: </span>
                                <span className="font-black text-gray-800">{(selectedFactura.detalles || []).length}</span>
                            </div>
                            <button
                                onClick={() => setSelectedFactura(null)}
                                className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesVentas;
