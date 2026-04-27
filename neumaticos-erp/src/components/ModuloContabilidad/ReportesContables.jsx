import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, BarChart3, Download, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReportesContables } from '../../hooks/useReportesContables';
import { usePeriodosContables } from '../../hooks/usePeriodosContables';
import { usePlanCuentas } from '../../hooks/usePlanCuentas';

const ReportesContables = () => {
  const [tabActiva, setTabActiva] = useState('diario');
  const { periodos } = usePeriodosContables();
  const { cuentas } = usePlanCuentas();
  const { loading, getLibroDiario, getLibroMayor, getSumasSaldos } = useReportesContables();

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [datos, setDatos] = useState([]);

  // Cargar periodo por defecto
  useEffect(() => {
    if (periodos.length > 0 && !periodoSeleccionado) {
      const activo = periodos.find(p => p.estado === 'Abierto') || periodos[0];
      setPeriodoSeleccionado(activo.id_proc_contable);
    }
  }, [periodos]);

  // Cargar datos cuando cambia la tab o los filtros
  useEffect(() => {
    if (!periodoSeleccionado) return;

    const cargarDatos = async () => {
      let res = [];
      if (tabActiva === 'diario') {
        res = await getLibroDiario(periodoSeleccionado);
      } else if (tabActiva === 'mayor' && cuentaSeleccionada) {
        res = await getLibroMayor(periodoSeleccionado, cuentaSeleccionada);
      } else if (tabActiva === 'balance') {
        res = await getSumasSaldos(periodoSeleccionado);
      }
      setDatos(res);
    };

    cargarDatos();
  }, [tabActiva, periodoSeleccionado, cuentaSeleccionada]);

  const formatMonto = (monto) => new Intl.NumberFormat('es-PY').format(monto);

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    const titulo = tabActiva === 'diario' ? 'LIBRO DIARIO' : tabActiva === 'mayor' ? 'LIBRO MAYOR' : 'BALANCE DE SUMAS Y SALDOS';
    const periodoStr = periodos.find(p => p.id_proc_contable == periodoSeleccionado)?.periodo_anho || '';

    doc.setFontSize(18);
    doc.text('NEUMÁTICOS ERP - REPORTE CONTABLE', 14, 20);
    doc.setFontSize(14);
    doc.text(`${titulo} - PERIODO ${periodoStr}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Fecha de impresión: ${new Date().toLocaleString()}`, 14, 38);

    if (tabActiva === 'diario') {
      const rows = [];
      datos.forEach(asiento => {
        rows.push([{ content: `Asiento #${asiento.id_asiento} - ${new Date(asiento.fecha).toLocaleDateString()} - ${asiento.descripcion}`, colSpan: 3, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
        asiento.asiento_detalle.forEach(det => {
          rows.push([
            det.plan_cuentas?.nombre || '',
            det.debe_haber ? formatMonto(det.monto) : '',
            !det.debe_haber ? formatMonto(det.monto) : ''
          ]);
        });
      });
      autoTable(doc, {
        startY: 45,
        head: [['Cuenta / Concepto', 'Debe', 'Haber']],
        body: rows,
      });
    } else if (tabActiva === 'mayor') {
      const rows = datos.map(mov => [
        new Date(mov.asientos?.fecha).toLocaleDateString(),
        mov.asientos?.descripcion || '',
        mov.debe_haber ? formatMonto(mov.monto) : '',
        !mov.debe_haber ? formatMonto(mov.monto) : ''
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Concepto', 'Debe', 'Haber']],
        body: rows,
      });
    } else if (tabActiva === 'balance') {
      const rows = datos.map(b => [
        b.codigo,
        b.nombre,
        formatMonto(b.debe),
        formatMonto(b.haber),
        b.saldo_deudor > 0 ? formatMonto(b.saldo_deudor) : '-',
        b.saldo_acreedor > 0 ? formatMonto(b.saldo_acreedor) : '-'
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['Cod', 'Cuenta', 'Debe', 'Haber', 'S. Deudor', 'S. Acreedor']],
        body: rows,
      });
    }

    doc.save(`${titulo.replace(/ /g, '_')}_${periodoStr}.pdf`);
  };

  const renderFiltros = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-erp-orange" />
        <span className="font-bold text-gray-700 text-sm">Filtros:</span>
      </div>
      
      <select 
        className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200"
        value={periodoSeleccionado}
        onChange={(e) => setPeriodoSeleccionado(e.target.value)}
      >
        <option value="">Seleccionar Periodo...</option>
        {periodos.map(p => (
          <option key={p.id_proc_contable} value={p.id_proc_contable}>
            {p.periodo_anho} — {p.estado}
          </option>
        ))}
      </select>

      {tabActiva === 'mayor' && (
        <select 
          className="p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-orange-200 max-w-xs"
          value={cuentaSeleccionada}
          onChange={(e) => setCuentaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar Cuenta...</option>
          {cuentas.filter(c => c.asentable).map(c => (
            <option key={c.id_cuenta} value={c.id_cuenta}>
              {c.cuenta_contable} - {c.nombre}
            </option>
          ))}
        </select>
      )}

      <div className="ml-auto flex gap-2">
        <button 
          onClick={handleExportarPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-black hover:bg-red-100 transition-all border border-red-200"
          title="Descargar PDF"
        >
          <Download size={20} />
          <span className="text-xs">DESCARGAR PDF</span>
        </button>
      </div>
    </div>
  );

  const renderLibroDiario = () => (
    <div className="space-y-4">
      {Array.isArray(datos) && datos.map((asiento, index) => (
        <div key={asiento.id_asiento || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="font-black text-erp-orange">Asiento #{asiento.id_asiento || index + 1}</span>
              <span className="text-sm text-gray-500 font-bold">
                {asiento.fecha ? new Date(asiento.fecha).toLocaleDateString() : 'S/F'}
              </span>
            </div>
            <span className="text-sm italic text-gray-600">{asiento.descripcion}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b uppercase text-[10px] font-black">
                <th className="px-4 py-2 text-left">Código / Cuenta</th>
                <th className="px-4 py-2 text-right">Debe</th>
                <th className="px-4 py-2 text-right">Haber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.isArray(asiento.asiento_detalle) && asiento.asiento_detalle.map((det, idx) => (
                <tr key={`${asiento.id_asiento}-${idx}`} className="hover:bg-gray-50">
                  <td className={`px-4 py-2 ${det.debe_haber ? '' : 'pl-10 text-gray-600'}`}>
                    <span className="font-mono text-xs text-gray-400 mr-2">{det.plan_cuentas?.cuenta_contable || 'S/C'}</span>
                    <span className="font-bold">{det.plan_cuentas?.nombre || 'Cuenta no encontrada'}</span>
                    <div className="text-[10px] text-gray-400 italic leading-tight">{det.glosa}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-bold">{det.debe_haber ? formatMonto(det.monto) : '-'}</td>
                  <td className="px-4 py-2 text-right font-bold">{!det.debe_haber ? formatMonto(det.monto) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-black border-t">
              <tr>
                <td className="px-4 py-2 text-right uppercase text-[10px]">Totales Asiento</td>
                <td className="px-4 py-2 text-right text-erp-orange">{formatMonto(asiento.total_debe)}</td>
                <td className="px-4 py-2 text-right text-erp-orange">{formatMonto(asiento.total_haber)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
      {datos.length === 0 && !loading && (
        <div className="p-20 text-center text-gray-400 italic">No hay asientos registrados en este periodo.</div>
      )}
    </div>
  );

  const renderLibroMayor = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-erp-orange uppercase text-xs font-black">
          <tr>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Asiento</th>
            <th className="px-6 py-4">Concepto / Glosa</th>
            <th className="px-6 py-4 text-right">Debe</th>
            <th className="px-6 py-4 text-right">Haber</th>
            <th className="px-6 py-4 text-right">Saldo Acum.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.isArray(datos) && datos.reduce((acc, mov, idx) => {
            const debe = mov.debe_haber ? Number(mov.monto) : 0;
            const haber = !mov.debe_haber ? Number(mov.monto) : 0;
            const saldoAnterior = idx > 0 ? acc[idx-1].saldo : 0;
            const saldo = saldoAnterior + debe - haber;
            acc.push({ ...mov, saldo });
            return acc;
          }, []).map((mov, idx) => (
            <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-6 py-4 font-bold">
                {mov.asientos?.fecha ? new Date(mov.asientos.fecha).toLocaleDateString() : 'S/F'}
              </td>
              <td className="px-6 py-4 text-erp-orange font-black">#{mov.id_asiento}</td>
              <td className="px-6 py-4">
                <div className="font-bold text-gray-700">{mov.asientos?.descripcion || 'Sin descripción'}</div>
                <div className="text-xs text-gray-400">{mov.glosa}</div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-green-600">{mov.debe_haber ? formatMonto(mov.monto) : '-'}</td>
              <td className="px-6 py-4 text-right font-bold text-red-600">{!mov.debe_haber ? formatMonto(mov.monto) : '-'}</td>
              <td className="px-6 py-4 text-right font-black text-gray-800 bg-gray-50/50">{formatMonto(mov.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!cuentaSeleccionada && (
        <div className="p-20 text-center text-gray-400 italic">Seleccione una cuenta contable para ver su mayor.</div>
      )}
      {cuentaSeleccionada && datos.length === 0 && !loading && (
        <div className="p-20 text-center text-gray-400 italic">Esta cuenta no tiene movimientos en el periodo seleccionado.</div>
      )}
    </div>
  );

  const renderSumasSaldos = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-erp-orange text-white uppercase text-[10px] font-black">
          <tr>
            <th rowSpan="2" className="px-6 py-4 text-left border-r border-orange-400">Cuenta Contable</th>
            <th colSpan="2" className="px-6 py-2 text-center border-b border-orange-400">Sumas</th>
            <th colSpan="2" className="px-6 py-2 text-center border-b border-orange-400">Saldos</th>
          </tr>
          <tr>
            <th className="px-6 py-2 text-right border-r border-orange-400 bg-orange-600">Debe</th>
            <th className="px-6 py-2 text-right border-r border-orange-400 bg-orange-600">Haber</th>
            <th className="px-6 py-2 text-right border-r border-orange-400 bg-orange-700">Deudor</th>
            <th className="px-6 py-2 text-right bg-orange-700">Acreedor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.isArray(datos) && datos.map((b, idx) => (
            <tr key={idx} className="hover:bg-orange-50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-mono text-xs text-gray-400 mr-2">{b.codigo}</span>
                <span className="font-bold text-gray-800">{b.nombre}</span>
              </td>
              <td className="px-6 py-4 text-right font-bold">{formatMonto(b.debe)}</td>
              <td className="px-6 py-4 text-right font-bold">{formatMonto(b.haber)}</td>
              <td className="px-6 py-4 text-right font-black text-erp-orange bg-orange-50/30">{b.saldo_deudor > 0 ? formatMonto(b.saldo_deudor) : '-'}</td>
              <td className="px-6 py-4 text-right font-black text-erp-orange bg-orange-50/30">{b.saldo_acreedor > 0 ? formatMonto(b.saldo_acreedor) : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-800 text-white font-black">
          <tr>
            <td className="px-6 py-4 uppercase text-xs">Totales Generales</td>
            <td className="px-6 py-4 text-right">
              {formatMonto(Array.isArray(datos) ? datos.reduce((s, b) => s + (b.debe || 0), 0) : 0)}
            </td>
            <td className="px-6 py-4 text-right">
              {formatMonto(Array.isArray(datos) ? datos.reduce((s, b) => s + (b.haber || 0), 0) : 0)}
            </td>
            <td className="px-6 py-4 text-right text-erp-orange">
              {formatMonto(Array.isArray(datos) ? datos.reduce((s, b) => s + (b.saldo_deudor || 0), 0) : 0)}
            </td>
            <td className="px-6 py-4 text-right text-erp-orange">
              {formatMonto(Array.isArray(datos) ? datos.reduce((s, b) => s + (b.saldo_acreedor || 0), 0) : 0)}
            </td>
          </tr>
        </tfoot>
      </table>
      {datos.length === 0 && !loading && (
        <div className="p-20 text-center text-gray-400 italic">No hay movimientos para generar el balance.</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-erp-orange tracking-tight uppercase italic">
            Informes y Balances
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Contabilidad Analítica</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setTabActiva('diario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
              tabActiva === 'diario' ? 'bg-white text-erp-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen size={18} /> Diario
          </button>
          <button
            onClick={() => setTabActiva('mayor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
              tabActiva === 'mayor' ? 'bg-white text-erp-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} /> Mayor
          </button>
          <button
            onClick={() => setTabActiva('balance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${
              tabActiva === 'balance' ? 'bg-white text-erp-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 size={18} /> Balance
          </button>
        </div>
      </div>

      {renderFiltros()}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-erp-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-erp-orange font-black animate-pulse">GENERANDO INFORME...</p>
        </div>
      ) : (
        <>
          {tabActiva === 'diario' && renderLibroDiario()}
          {tabActiva === 'mayor' && renderLibroMayor()}
          {tabActiva === 'balance' && renderSumasSaldos()}
        </>
      )}
    </div>
  );
};

export default ReportesContables;
