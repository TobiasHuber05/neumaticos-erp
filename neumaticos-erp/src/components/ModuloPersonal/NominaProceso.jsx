import { useState } from 'react';
import { PlayCircle, CheckCircle2, FileText, DollarSign, Calendar, Calculator, AlertCircle, X, Plus } from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { puedeEditar } from '../../utils/permisos';
import PagoPorConcepto from './PagoPorConcepto';

// ── Modal de Recibo ──────────────────────────────────────────────
const ModalRecibo = ({ liq, proceso, onClose }) => {
  if (!liq) return null;

  const handlePrint = () => {
    const doc = new jsPDF();

    ['ORIGINAL', 'DUPLICADO'].forEach((tipo, index) => {
      if (index > 0) doc.addPage();

      // Encabezado
      doc.setFontSize(16);
      doc.setTextColor(234, 88, 12); // naranja
      doc.text('Neumáticos ERP', 14, 20);

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`RECIBO DE PAGO DE SALARIO — ${tipo}`, 14, 27);
      doc.text(`Periodo: ${proceso?.periodo}`, 150, 20);
      doc.text(`Fecha: ${proceso?.fechaPago}`, 150, 27);

      // Funcionario
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Funcionario:', 14, 40);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(liq.funcionarioNombre, 14, 47);
      doc.setFont('helvetica', 'normal');

      // Tabla de conceptos
      autoTable(doc, {
        startY: 55,
        head: [['Concepto', 'Tipo', 'Monto']],
        body: liq.lineas?.map(l => [
          l.nombre,
          l.tipo,
          `${l.tipo === 'Egreso' ? '- ' : ''}${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(l.monto)}`
        ]) ?? [],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [234, 88, 12] },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Totales
      doc.setFontSize(10);
      doc.text('Total Ingresos:', 14, finalY);
      doc.text(new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(liq.totalIngresos), 150, finalY);

      doc.text('Total Descuentos:', 14, finalY + 7);
      doc.text(`- ${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(liq.totalEgresos)}`, 150, finalY + 7);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(234, 88, 12);
      doc.text('NETO A COBRAR:', 14, finalY + 16);
      doc.text(new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(liq.neto), 150, finalY + 16);

      // Firmas
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.line(14, finalY + 35, 80, finalY + 35);
      doc.text('Firma Empleador', 14, finalY + 40);
      doc.line(120, finalY + 35, 190, finalY + 35);
      doc.text('Firma Funcionario', 120, finalY + 40);
    });

    doc.save(`recibo-${liq.funcionarioNombre}-${proceso?.periodo}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">

        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Recibo de Pago</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-erp-orange text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors">
              <FileText size={16} /> Descargar PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido imprimible — original y duplicado */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none" id="recibo-print">

          {['ORIGINAL', 'DUPLICADO'].map((tipo) => (
            <div key={tipo} className="border-2 border-gray-200 rounded-2xl p-6 print:border-black print:rounded-none print:mb-8">

              {/* Encabezado */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-erp-orange uppercase">Neumáticos ERP</h3>
                  <p className="text-xs text-gray-500 font-bold">RECIBO DE PAGO DE SALARIO — {tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Periodo</p>
                  <p className="text-lg font-black text-gray-800">{proceso?.periodo}</p>
                  <p className="text-xs text-gray-400 mt-1">{proceso?.fechaPago}</p>
                </div>
              </div>

              {/* Datos del funcionario */}
              <div className="bg-orange-50 rounded-xl p-4 mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Funcionario</p>
                <p className="text-lg font-black text-gray-800">{liq.funcionarioNombre}</p>
              </div>

              {/* Conceptos */}
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                    <th className="text-right py-2 text-[10px] font-black text-gray-400 uppercase">Tipo</th>
                    <th className="text-right py-2 text-[10px] font-black text-gray-400 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {liq.lineas?.map((linea, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-gray-700">{linea.nombre}</td>
                      <td className="py-2 text-right">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          linea.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {linea.tipo}
                        </span>
                      </td>
                      <td className={`py-2 text-right font-black ${
                        linea.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {linea.tipo === 'Egreso' ? '- ' : ''}{formatGua(linea.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="border-t-2 border-gray-200 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-500">Total Ingresos</span>
                  <span className="font-black text-green-600">{formatGua(liq.totalIngresos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-500">Total Descuentos</span>
                  <span className="font-black text-red-500">- {formatGua(liq.totalEgresos)}</span>
                </div>
                <div className="flex justify-between text-lg mt-2 pt-2 border-t border-gray-200">
                  <span className="font-black text-gray-800 uppercase">Neto a Cobrar</span>
                  <span className="font-black text-erp-orange">{formatGua(liq.neto)}</span>
                </div>
              </div>

              {/* Firma */}
              <div className="flex justify-between mt-8 pt-4 border-t border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-32 border-t border-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Firma Empleador</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-t border-gray-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Firma Funcionario</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────
const NominaProceso = ({ personal, cuentas = [] }) => {
  const { procesosPago, actions, config } = personal;
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showPagoPorConcepto, setShowPagoPorConcepto] = useState(false);
  const [reciboLiq,   setReciboLiq]     = useState(null);
  const [cuentaId,    setCuentaId]      = useState('');
  const [saldoError,  setSaldoError]    = useState('');

  const mesActual        = new Date().toISOString().slice(0, 7);
  const procesoMesActual = procesosPago.find(p => p.periodo === mesActual);
  const currentProceso   = procesoMesActual || procesosPago[procesosPago.length - 1];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-erp-orange/10 rounded-xl flex items-center justify-center text-erp-orange">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salario Mínimo</div>
            <div className="text-xl font-black text-gray-800">{formatGua(config.salarioMinimo)}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Calculator size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IPS Obrero</div>
            <div className="text-xl font-black text-gray-800">{config.porcentajeIPS}%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próximo Cierre</div>
            <div className="text-xl font-black text-gray-800">30 Abr 2026</div>
          </div>
        </div>
      </div>

      {/* Proceso */}
      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="p-8 border-b border-orange-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <PlayCircle className={currentProceso?.estado === 'Abierto' ? 'text-green-500 animate-pulse' : 'text-erp-orange'} />
              Proceso Actual: {currentProceso?.periodo || 'Ninguno'}
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
              Estado: {currentProceso?.estado || 'Sin iniciar'}
            </p>
          </div>
          <div className="flex gap-3">
            {puedeEditar('personal') && (
              <button onClick={() => setShowPagoPorConcepto(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2">
                <Plus size={16} />
                Pago por Concepto
              </button>
            )}
            {puedeEditar('personal') && (
              <button onClick={() => setShowConfirm(true)}
                disabled={procesoMesActual?.estado !== 'Abierto'}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  procesoMesActual?.estado === 'Abierto'
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                <CheckCircle2 size={16} />
                Cerrar y Contabilizar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-orange-50/30 text-erp-orange text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Funcionario</th>
                <th className="px-8 py-4 text-right">Total Ingresos</th>
                <th className="px-8 py-4 text-right">Total Egresos</th>
                <th className="px-8 py-4 text-right">Neto a Cobrar</th>
                <th className="px-8 py-4 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {currentProceso?.liquidaciones?.map((liq, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-800">{liq.funcionarioNombre}</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase">Liquidación Generada</div>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-green-600">{formatGua(liq.totalIngresos)}</td>
                  <td className="px-8 py-5 text-right font-bold text-red-500">{formatGua(liq.totalEgresos)}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-orange-50 text-erp-orange px-3 py-1 rounded-lg font-black">
                      {formatGua(liq.neto)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button
                      onClick={() => setReciboLiq(liq)}
                      className="p-2 text-erp-orange hover:bg-orange-100 rounded-lg transition-colors"
                      title="Ver Recibo"
                    >
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!currentProceso?.liquidaciones || currentProceso.liquidaciones.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Calculator size={48} />
                      <p className="font-black uppercase text-sm tracking-tighter">No hay cálculos realizados en este periodo</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Confirmar Cierre */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 text-erp-orange rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">¿Cerrar Nómina?</h2>
              <p className="text-gray-500 font-medium">
                Al cerrar el proceso se generará el asiento contable de “Pago de Salarios” y se
                registrará el egreso en la cuenta bancaria seleccionada.
                <span className="block mt-2 font-bold text-erp-orange underline">Esta acción no se puede deshacer.</span>
              </p>

               {/* Selector de cuenta bancaria */}
               <div className="text-left space-y-2">
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                   Cuenta bancaria para el pago <span className="text-red-500">*</span>
                 </label>
                 <select
                   value={cuentaId}
                   onChange={(e) => setCuentaId(e.target.value)}
                   className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-erp-orange outline-none text-sm font-medium bg-white"
                 >
                   <option value="">Seleccionar cuenta...</option>
                   {cuentas.map((cta) => (
                     <option key={cta.id_cuenta} value={cta.id_cuenta}>
                       {cta.banco} — Cta. Nº {cta.numero_cuenta}
                       {cta.saldo != null ? ` (Gs. ${Number(cta.saldo).toLocaleString('de-DE')})` : ''}
                     </option>
                   ))}
                 </select>
                 {!cuentaId && (
                   <p className="text-[10px] text-amber-600 font-bold">⚠️ Debes seleccionar una cuenta para continuar.</p>
                 )}
                 {saldoError && (
                   <p className="text-[10px] text-red-600 font-bold mt-1">❌ {saldoError}</p>
                 )}
               </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => { setShowConfirm(false); setCuentaId(''); }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Volver
              </button>
<button
  disabled={!cuentaId}
  onClick={async () => {
    try {
      await actions.cerrarProcesoPago(currentProceso.id, Number(cuentaId));
      setShowConfirm(false);
      setCuentaId('');
      setSaldoError('');
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Error al cerrar proceso';
      if (errorMsg.includes('Saldo insuficiente')) {
        setSaldoError(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  }}
  className="flex-1 py-4 bg-erp-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed">
  Confirmar Cierre
</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibo */}
      {reciboLiq && (
        <ModalRecibo
          liq={reciboLiq}
          proceso={currentProceso}
          onClose={() => setReciboLiq(null)}
        />
      )}

      {/* Modal Pago por Concepto */}
      {showPagoPorConcepto && (
        <PagoPorConcepto
          personal={personal}
          cuentas={cuentas}
          onClose={() => setShowPagoPorConcepto(false)}
        />
      )}
    </div>
  );
};

export default NominaProceso;