import { useState } from 'react';
import { Settings, Plus, CheckCircle2, XCircle, Info, X } from 'lucide-react';
import axios from 'axios';
import { puedeEditar } from '../../utils/permisos';

const API = 'http://localhost:3000/api';

// Configurar token de autorización para axios
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const ConceptosSalariales = ({ personal }) => {
  const { conceptos, actions } = personal;
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [form, setForm] = useState({
    nombre: '', descripcion: '', tipo: 'Ingreso',
    monto: '', afecta_ips: false,
  });

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleGuardar = async () => {
    if (!form.nombre) { setErrorForm('El nombre es obligatorio.'); return; }
    setErrorForm('');
    setGuardando(true);
    try {
      await axios.post(`${API}/salarios/conceptos`, {
        nombre:      form.nombre,
        descripcion: form.descripcion,
        credito:     form.tipo === 'Ingreso' && form.monto ? Number(form.monto) : null,
        debito:      form.tipo === 'Egreso'  && form.monto ? Number(form.monto) : null,
        afecta_ips:  form.afecta_ips,
      });
      await actions.recargar();
      setForm({ nombre: '', descripcion: '', tipo: 'Ingreso', monto: '', afecta_ips: false });
      setShowForm(false);
    } catch {
      setErrorForm('Error al guardar el concepto.');
    } finally {
      setGuardando(false);
    }
  };

  // Mapear campos del backend al formato del frontend
  const conceptosMapeados = conceptos.map(c => ({
    ...c,
    tipo:      c.credito !== null ? 'Ingreso' : 'Egreso',
    esIPS:     c.afecta_ips ?? false,
    automatico: false,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="p-8 border-b border-orange-50 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
              <Settings className="text-erp-orange" />
              Configuración de Conceptos
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
              Defina qué ingresos y egresos afectan al IPS
            </p>
          </div>
          {puedeEditar('personal') && (
            <button onClick={() => setShowForm(true)}
              className="bg-erp-orange text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
              <Plus size={18} />
              Nuevo Concepto
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-orange-50/50 text-erp-orange text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Concepto Salarial</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4 text-center">Filtro IPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {conceptosMapeados.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-gray-400 text-sm">
                    No hay conceptos registrados. Creá uno con el botón de arriba.
                  </td>
                </tr>
              )}
              {conceptosMapeados.map((c) => (
                <tr key={c.id_concepto} className="hover:bg-orange-50/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-800">{c.nombre}</div>
                    {c.descripcion && (
                      <div className="text-[10px] text-gray-400 font-medium">{c.descripcion}</div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      c.tipo === 'Ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      {c.esIPS ? (
                        <div className="flex items-center gap-1 text-green-600 font-black text-[10px] uppercase">
                          <CheckCircle2 size={16} /> Deducible
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400 font-black text-[10px] uppercase">
                          <XCircle size={16} /> Exento
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota IPS */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4 items-start">
        <Info className="text-blue-500 shrink-0" size={24} />
        <div>
          <h4 className="font-black text-blue-900 uppercase text-sm tracking-tight mb-1">Nota sobre IPS</h4>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            Los conceptos marcados como "Deducible" sumarán para la base de cálculo del 9% obrero.
            La bonificación familiar por Ley no es deducible de IPS ni forma parte del salario imponible.
          </p>
        </div>
      </div>

      {/* Modal Nuevo Concepto */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-orange-100">

            <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-erp-orange uppercase tracking-tighter">Nuevo Concepto</h2>
                <p className="text-xs text-gray-500 font-medium">Definí un ingreso o egreso salarial</p>
              </div>
              <button onClick={() => { setShowForm(false); setErrorForm(''); }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Ej. Horas Extras 50%" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descripción</label>
                <input name="descripcion" value={form.descripcion} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Opcional" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tipo</label>
                <select name="tipo" value={form.tipo} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="Ingreso">Ingreso</option>
                  <option value="Egreso">Egreso</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto fijo (opcional)</label>
                <input type="number" name="monto" value={form.monto} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Dejá vacío si es variable" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-orange-50 rounded-xl">
                <input type="checkbox" name="afecta_ips" checked={form.afecta_ips} onChange={handleChange}
                  className="w-4 h-4 accent-orange-500" />
                <div>
                  <p className="font-bold text-sm text-gray-700">Afecta IPS</p>
                  <p className="text-[10px] text-gray-400">Se incluye en la base del 9% obrero</p>
                </div>
              </label>

              {errorForm && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                  {errorForm}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setErrorForm(''); }}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                disabled={guardando}>
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptosSalariales;