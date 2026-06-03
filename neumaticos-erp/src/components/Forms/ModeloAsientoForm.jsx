import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const OPERACIONES = [
  { id: 'VENTA_FACTURA', descripcion: 'Factura de Venta' },
  { id: 'VENTA_NOTA_CREDITO', descripcion: 'Nota de Crédito - Venta' },
  { id: 'COMPRA_FACTURA', descripcion: 'Factura de Compra' },
  { id: 'COMPRA_NOTA_CREDITO', descripcion: 'Nota de Crédito - Compra' },
  { id: 'COBRO_CLIENTE', descripcion: 'Cobro a Cliente' },
  { id: 'PAGO_PROVEEDOR', descripcion: 'Pago a Proveedor' },
  { id: 'TESORERIA_DEPOSITO', descripcion: 'Depósito Bancario' },
  { id: 'TESORERIA_INTERESES', descripcion: 'Intereses Bancarios' },
  { id: 'TESORERIA_GASTO', descripcion: 'Gasto Bancario' },
  { id: 'TESORERIA_CHEQUE_RECHAZADO', descripcion: 'Cheque Rechazado' },
  { id: 'NOMINA_SUELDOS', descripcion: 'Nómina - Pago de Salarios' },
];

const lineaVacia = () => ({
  descripcion_final: '',
  id_cuenta: '',
  debe_haber: true,
  iva: false,
  es_cuenta_bancaria: false,
});

const ModeloAsientoForm = ({ initial, planCuentas = [], onCancelar, onGuardar }) => {
  const [operacion_asiento, setOperacion] = useState(initial?.operacion_asiento || '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion || '');
  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    if (initial) {
      setOperacion(initial.operacion_asiento || '');
      setDescripcion(initial.descripcion || '');
      setLineas(
        (initial.detalle_modelo_asiento || []).map((d) => ({
          descripcion_final: d.descripcion_final || '',
          id_cuenta: d.id_cuenta ? String(d.id_cuenta) : '',
          debe_haber: d.debe_haber ?? true,
          iva: d.iva || false,
          es_cuenta_bancaria: d.es_cuenta_bancaria || false,
        })),
      );
    } else {
      setOperacion('');
      setDescripcion('');
      setLineas([lineaVacia(), lineaVacia()]);
    }
  }, [initial]);

  const agregarLinea = () => setLineas([...lineas, lineaVacia()]);

  const eliminarLinea = (idx) => {
    if (lineas.length <= 2) return;
    setLineas(lineas.filter((_, i) => i !== idx));
  };

  const actualizarLinea = (idx, campo, valor) => {
    const nuevas = [...lineas];
    nuevas[idx] = { ...nuevas[idx], [campo]: valor };
    setLineas(nuevas);
  };

  const handleGuardar = () => {
    if (!operacion_asiento || !descripcion) return;
    onGuardar({
      operacion_asiento,
      descripcion,
      tipo_asiento: 'Automatico',
      lineas: lineas.map((l) => ({
        descripcion_final: l.descripcion_final,
        id_cuenta: l.id_cuenta ? Number(l.id_cuenta) : null,
        debe_haber: l.debe_haber,
        iva: l.iva,
        es_cuenta_bancaria: l.es_cuenta_bancaria,
      })),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
      <div className="bg-erp-orange p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Save size={22} />
          <h2 className="font-bold text-lg">{initial ? 'Editar Modelo' : 'Nuevo Modelo de Asiento'}</h2>
        </div>
        <button type="button" onClick={onCancelar} className="rounded-full p-2 hover:bg-orange-500/30 text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Operación</label>
            {initial ? (
              <input
                type="text"
                value={operacion_asiento}
                disabled
                className="w-full p-3 border rounded-lg bg-gray-50 text-gray-500 outline-none"
              />
            ) : (
              <select
                value={operacion_asiento}
                onChange={(e) => {
                  const op = OPERACIONES.find((o) => o.id === e.target.value);
                  setOperacion(e.target.value);
                  if (op) setDescripcion(op.descripcion);
                }}
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-erp-orange outline-none"
              >
                <option value="">Seleccionar operación</option>
                {OPERACIONES.map((op) => (
                  <option key={op.id} value={op.id}>{op.descripcion}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">Líneas del asiento</h3>
            <button
              type="button"
              onClick={agregarLinea}
              className="flex items-center gap-1 text-sm text-erp-orange font-bold hover:text-orange-600"
            >
              <Plus size={16} /> Agregar línea
            </button>
          </div>

          <div className="space-y-3">
            {lineas.map((l, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={l.descripcion_final}
                    onChange={(e) => actualizarLinea(idx, 'descripcion_final', e.target.value)}
                    placeholder="Glosa de la línea"
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-erp-orange outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cuenta Contable</label>
                  <select
                    value={l.id_cuenta}
                    onChange={(e) => actualizarLinea(idx, 'id_cuenta', e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-erp-orange outline-none"
                  >
                    <option value="">Seleccionar cuenta</option>
                    {planCuentas.map((c) => (
                      <option key={c.id_cuenta} value={c.id_cuenta}>
                        {c.cuenta_contable} - {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                  <select
                    value={l.debe_haber ? 'debe' : 'haber'}
                    onChange={(e) => actualizarLinea(idx, 'debe_haber', e.target.value === 'debe')}
                    className="w-full p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-erp-orange outline-none"
                  >
                    <option value="debe">DEBE</option>
                    <option value="haber">HABER</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-3 pb-1">
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={l.iva}
                      onChange={(e) => actualizarLinea(idx, 'iva', e.target.checked)}
                      className="rounded"
                    />
                    IVA
                  </label>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={l.es_cuenta_bancaria}
                      onChange={(e) => actualizarLinea(idx, 'es_cuenta_bancaria', e.target.checked)}
                      className="rounded"
                    />
                    Banco
                  </label>
                </div>
                <div className="col-span-1 flex justify-center pb-1">
                  {lineas.length > 2 && (
                    <button
                      type="button"
                      onClick={() => eliminarLinea(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-5 py-3 rounded-lg bg-erp-orange text-white font-bold hover:bg-orange-600 flex items-center gap-2"
          >
            <Save size={18} /> {initial ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeloAsientoForm;
