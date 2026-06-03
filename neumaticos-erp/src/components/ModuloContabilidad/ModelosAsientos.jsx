import { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import ModeloAsientoForm from '../Forms/ModeloAsientoForm';
import { puedeEditar } from '../../utils/permisos';

const API = '/api/contabilidad/modelos-asientos';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

const ModelosAsientos = () => {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [msg, setMsg] = useState(null);
  const [planCuentas, setPlanCuentas] = useState([]);

  const fetchModelos = async () => {
    try {
      const res = await fetch(API, { headers: getHeaders() });
      if (res.ok) setModelos(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanCuentas = async () => {
    try {
      const res = await fetch('/api/contabilidad/plan-cuentas', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPlanCuentas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchModelos();
    fetchPlanCuentas();
  }, []);

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este modelo de asiento?')) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        setMsg('Modelo eliminado');
        fetchModelos();
      } else {
        const err = await res.json();
        setMsg(err.error || 'Error al eliminar');
      }
    } catch {
      setMsg('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-erp-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getNombreCuenta = (id) => {
    const c = planCuentas.find(p => p.id_cuenta === id);
    return c ? `${c.cuenta_contable} - ${c.nombre}` : '—';
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-sm p-3 flex justify-between items-center">
          {msg}
          <button type="button" className="text-xs underline" onClick={() => setMsg(null)}>Cerrar</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Modelos de Asientos</h2>
          <p className="text-gray-500 text-sm">Configura qué cuentas contables usar para cada operación automática</p>
        </div>
        {puedeEditar('contabilidad') && (
          <button
            onClick={() => { setEditando(null); setMostrarForm(true); }}
            className="flex items-center gap-2 bg-erp-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors"
          >
            <Plus size={20} /> Nuevo Modelo
          </button>
        )}
      </div>

      {mostrarForm && (
        <ModeloAsientoForm
          initial={editando}
          planCuentas={planCuentas}
          onCancelar={() => { setMostrarForm(false); setEditando(null); }}
          onGuardar={async (data) => {
            const url = editando ? `${API}/${editando.id_modelo_asiento}` : API;
            const method = editando ? 'PUT' : 'POST';
            try {
              const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(data),
              });
              if (res.ok) {
                setMsg(editando ? 'Modelo actualizado' : 'Modelo creado');
                setMostrarForm(false);
                setEditando(null);
                fetchModelos();
              } else {
                const err = await res.json();
                setMsg(err.error || 'Error al guardar');
              }
            } catch {
              setMsg('Error de conexión');
            }
          }}
        />
      )}

      {modelos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-400 mb-1">No hay modelos configurados</p>
          <p className="text-sm text-gray-400">Ejecutá el seed o creá un modelo nuevo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modelos.map((m) => (
            <div key={m.id_modelo_asiento} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="text-erp-orange" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-800">{m.descripcion}</h3>
                    <p className="text-xs text-gray-500 font-mono">{m.operacion_asiento}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {puedeEditar('contabilidad') && (
                    <>
                      <button
                        onClick={() => { setEditando(m); setMostrarForm(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(m.id_modelo_asiento)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase text-xs">Item</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase text-xs">Descripción</th>
                      <th className="px-4 py-2 text-left font-bold text-gray-600 uppercase text-xs">Cuenta Contable</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-600 uppercase text-xs">Debe/Haber</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-600 uppercase text-xs">IVA</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-600 uppercase text-xs">Cta. Bancaria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(m.detalle_modelo_asiento || []).map((d) => (
                      <tr key={d.id_detalle_mod || d.item} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center font-mono">{d.item}</td>
                        <td className="px-4 py-2">{d.descripcion_final || '—'}</td>
                        <td className="px-4 py-2 font-mono text-xs">{getNombreCuenta(d.id_cuenta)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${d.debe_haber ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {d.debe_haber ? 'DEBE' : 'HABER'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">{d.iva ? '✅' : '—'}</td>
                        <td className="px-4 py-2 text-center">{d.es_cuenta_bancaria ? '🏦' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelosAsientos;
