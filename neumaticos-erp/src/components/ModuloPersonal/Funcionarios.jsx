import { useState, useEffect } from 'react';
import {
  UserPlus, Search, Briefcase, Trash2, Edit2, Users2,
  Plus, X, Settings2, CreditCard, RotateCcw, History
} from 'lucide-react';
import { formatGua } from '../../utils/personalLogic';
import axios from 'axios';
import { puedeEditar } from '../../utils/permisos';

const API = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const token = localStorage.getItem('token');
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// ══════════════════════════════════════════════════════════════
//  MODAL CONCEPTOS EXTRAS
// ══════════════════════════════════════════════════════════════
const ModalConceptos = ({ funcionario, onClose, actions }) => {
  const [conceptosBase, setConceptosBase] = useState([]);
  const [listaConceptos, setListaConceptos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    id_concepto_base: '',
    monto: '',
    recurrente: false,
  });

  const baseSeleccionada = conceptosBase.find(
    c => c.id_concepto === Number(form.id_concepto_base)
  );
  const tipoBase = baseSeleccionada
    ? (baseSeleccionada.credito !== null ? 'Ingreso' : 'Egreso')
    : null;
  const afectaIPS = baseSeleccionada?.afecta_ips ?? false;

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const [base, extras] = await Promise.all([
        axios.get(`${API}/salarios/conceptos`),
        actions.getConceptosFuncionario(funcionario.id),
      ]);
      setConceptosBase(base.data);
      setListaConceptos(extras);
    } catch {
      setError('Error al cargar conceptos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [funcionario.id]);

  const handleAgregar = async () => {
    if (!form.id_concepto_base) { setError('Seleccioná un concepto.'); return; }
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
      setError('El monto debe ser un número mayor a 0.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      await actions.agregarConceptoFuncionario(funcionario.id, {
        nombre: baseSeleccionada.nombre,
        descripcion: baseSeleccionada.descripcion || null,
        tipo: tipoBase,
        monto: Number(form.monto),
        afecta_ips: afectaIPS,
        recurrente: form.recurrente,
      });
      setForm({ id_concepto_base: '', monto: '', recurrente: false });
      await cargar();
    } catch {
      setError('Error al agregar el concepto.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este concepto?')) return;
    setEliminando(id);
    try {
      await actions.eliminarConceptoFuncionario(id);
      setListaConceptos(prev => prev.filter(c => c.id_concepto !== id));
    } catch {
      alert('Error al eliminar.');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-orange-100">

        {/* Header */}
        <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-erp-orange" />
              <h2 className="text-lg font-black text-erp-orange uppercase tracking-tighter">
                Conceptos Extras
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{funcionario.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Lista conceptos asignados */}
        <div className="px-6 pt-5 max-h-[30vh] overflow-y-auto space-y-2">
          {cargando && (
            <p className="text-center text-gray-400 text-sm py-4">Cargando...</p>
          )}
          {!cargando && listaConceptos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4 italic">
              No hay conceptos extras asignados.
            </p>
          )}
          {listaConceptos.map(c => {
            const esIngreso = c.credito !== null;
            return (
              <div key={c.id_concepto}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 group">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full
                    ${esIngreso ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {esIngreso ? 'Ingreso' : 'Egreso'}
                  </span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{c.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.afecta_ips && (
                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          Afecta IPS
                        </span>
                      )}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                        ${c.formula === 'recurrente'
                          ? 'text-purple-500 bg-purple-50'
                          : 'text-gray-400 bg-gray-100'}`}>
                        {c.formula === 'recurrente' ? 'Recurrente' : 'Único uso'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-sm ${esIngreso ? 'text-green-600' : 'text-red-500'}`}>
                    {esIngreso ? '+' : '-'}{formatGua(Number(c.credito ?? c.debito ?? 0))}
                  </span>
                  {puedeEditar('personal') && (
                    <button
                      onClick={() => handleEliminar(c.id_concepto)}
                      disabled={eliminando === c.id_concepto}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Formulario agregar */}
        {puedeEditar('personal') && (
          <div className="p-6 border-t border-gray-100 mt-2 space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              + Asignar Concepto
            </p>

            {/* Selector concepto base */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Concepto <span className="text-red-400">*</span>
              </label>
              <select
                value={form.id_concepto_base}
                onChange={e => setForm(p => ({ ...p, id_concepto_base: e.target.value, monto: '' }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50 text-sm"
              >
                <option value="">Seleccionar concepto...</option>
                {conceptosBase.map(c => (
                  <option key={c.id_concepto} value={c.id_concepto}>
                    {c.nombre} — {c.credito !== null ? 'Ingreso' : 'Egreso'}
                  </option>
                ))}
              </select>
            </div>

            {/* Info del concepto base — solo lectura */}
            {baseSeleccionada && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase ml-1">Tipo</label>
                  <div className="px-4 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
                    {tipoBase}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-300 uppercase ml-1">Afecta IPS</label>
                  <div className="px-4 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
                    {afectaIPS ? 'Sí — suma al 9%' : 'No'}
                  </div>
                </div>
              </div>
            )}

            {/* Monto */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Monto (₲) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.monto}
                onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                disabled={!baseSeleccionada}
                placeholder={baseSeleccionada ? 'Ej. 500000' : 'Primero seleccioná un concepto'}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {form.monto && !isNaN(Number(form.monto)) && Number(form.monto) > 0 && (
                <p className="text-xs font-black text-erp-orange ml-1 mt-1">
                  {formatGua(Number(form.monto))}
                </p>
              )}
            </div>

            {/* Recurrente */}
            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors cursor-pointer
              ${form.recurrente ? 'border-purple-300 bg-purple-50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}
              ${!baseSeleccionada ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={form.recurrente}
                onChange={e => setForm(p => ({ ...p, recurrente: e.target.checked }))}
                className="w-4 h-4 accent-purple-500"
              />
              <div>
                <p className="text-xs font-black text-gray-700">Recurrente</p>
                <p className="text-[10px] text-gray-400">
                  Se aplica todos los meses automáticamente
                </p>
              </div>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleAgregar}
              disabled={guardando || !baseSeleccionada}
              className="w-full py-3.5 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Agregar Concepto'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  MODAL CREAR CARGO
// ══════════════════════════════════════════════════════════════
const ModalCrearCargo = ({ onClose, onCreado }) => {
  const [form, setForm] = useState({ nombre_cargo: '', descripcion_cargo: '', area_superior: '', sueldo_base: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.nombre_cargo.trim()) { setError('El nombre del cargo es obligatorio.'); return; }
    if (!form.sueldo_base || isNaN(Number(form.sueldo_base))) {
      setError('El sueldo base es obligatorio y debe ser un número.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      const res = await axios.post(`${API}/cargos`, {
        nombre_cargo: form.nombre_cargo.trim(),
        descripcion_cargo: form.descripcion_cargo.trim() || null,
        area_superior: form.area_superior.trim() || null,
        sueldo_base: Number(form.sueldo_base),
      });
      onCreado(res.data);
      onClose();
    } catch {
      setError('Error al crear el cargo. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100">
        <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-start">
          <div>
            <h2 className="text-lg font-black text-erp-orange uppercase tracking-tighter">Nuevo Cargo</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Completá los datos del cargo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
              Nombre del Cargo <span className="text-red-400">*</span>
            </label>
            <input name="nombre_cargo" value={form.nombre_cargo} onChange={handleChange}
              placeholder="Ej. Vendedor, Contador, Gerente..."
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
              Sueldo Base (₲) <span className="text-red-400">*</span>
            </label>
            <input name="sueldo_base" type="number" value={form.sueldo_base} onChange={handleChange}
              placeholder="Ej. 2550000"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
            {form.sueldo_base && !isNaN(Number(form.sueldo_base)) && Number(form.sueldo_base) > 0 && (
              <p className="text-xs font-black text-erp-orange ml-1 mt-1">
                {formatGua(Number(form.sueldo_base))}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
              Área / Departamento
            </label>
            <input name="area_superior" value={form.area_superior} onChange={handleChange}
              placeholder="Ej. Ventas, RRHH..."
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descripción</label>
            <textarea name="descripcion_cargo" value={form.descripcion_cargo} onChange={handleChange}
              rows={2} placeholder="Descripción opcional del cargo..."
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50 resize-none" />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={guardando}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60">
            {guardando ? 'Guardando...' : 'Crear Cargo'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ══════════════════════════════════════════════════════════════
//  MODAL HISTORIAL DE CARGOS
// ══════════════════════════════════════════════════════════════
const ModalHistorial = ({ funcionario, onClose }) => {
  const historial = funcionario.historialCargos ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100">

        <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-erp-orange" />
              <h2 className="text-lg font-black text-erp-orange uppercase tracking-tighter">
                Historial de Cargos
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{funcionario.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {historial.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8 italic">
              Sin historial registrado.
            </p>
          ) : (
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-100" />

              <div className="space-y-4">
                {historial.map((h, idx) => {
                  const esActual = idx === 0; // ordenado desc, el primero es el actual
                  return (
                    <div key={idx} className="flex gap-4 items-start pl-2">
                      {/* Punto en la línea */}
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 z-10
                        ${esActual
                          ? 'bg-erp-orange border-erp-orange'
                          : 'bg-white border-orange-300'}`}
                      />
                      {/* Contenido */}
                      <div className={`flex-1 px-4 py-3 rounded-2xl border
                        ${esActual
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-sm
                            ${esActual ? 'text-erp-orange' : 'text-gray-700'}`}>
                            {h.cargo}
                          </span>
                          {esActual && (
                            <span className="text-[9px] font-black px-2 py-1 bg-erp-orange text-white rounded-full uppercase">
                              Actual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 font-medium">
                          <span>Desde: {h.fecha ?? '—'}</span>
                          {h.fechaSalida && (
                            <>
                              <span>→</span>
                              <span>Hasta: {h.fechaSalida}</span>
                            </>
                          )}
                          {esActual && !h.fechaSalida && (
                            <>
                              <span>→</span>
                              <span className="text-erp-orange font-bold">Presente</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  MODAL EDITAR FUNCIONARIO
// ══════════════════════════════════════════════════════════════
const ModalEditarFuncionario = ({ funcionario, cargos, onClose, actions }) => {
  const [form, setForm] = useState({
    nombre: funcionario.nombre.split(' ')[0] ?? '',
    apellido: funcionario.nombre.split(' ').slice(1).join(' ') ?? '',
    ci: funcionario.documento ?? '',
    id_cargo: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const cargoActualObj = cargos.find(
    c => c.nombre_cargo === funcionario.cargoActual
  );

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      await actions.actualizarCargo(
        funcionario.id,
        form.id_cargo ? Number(form.id_cargo) : cargoActualObj?.id_cargo,
        form.fecha_ingreso
      );
      await actions.recargar();
      onClose();
    } catch {
      setError('Error al actualizar. Revisá los datos.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100">

        <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Edit2 size={18} className="text-erp-orange" />
              <h2 className="text-lg font-black text-erp-orange uppercase tracking-tighter">
                Editar Funcionario
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{funcionario.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Cargo actual — informativo */}
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
            <Briefcase size={16} className="text-erp-orange" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Cargo actual</p>
              <p className="text-sm font-black text-erp-orange">{funcionario.cargoActual}</p>
            </div>
          </div>

          {/* Cambiar cargo */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
              Cambiar a cargo
            </label>
            <select name="id_cargo" value={form.id_cargo} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
              <option value="">— Mantener cargo actual —</option>
              {cargos
                .filter(c => c.nombre_cargo !== funcionario.cargoActual)
                .map(c => (
                  <option key={c.id_cargo} value={c.id_cargo}>
                    {c.nombre_cargo} — {new Intl.NumberFormat('es-PY', {
                      style: 'currency', currency: 'PYG'
                    }).format(c.sueldo_base ?? 0)}
                  </option>
                ))}
            </select>
            {form.id_cargo && (
              <p className="text-[10px] text-orange-500 font-bold ml-1 mt-1">
                ⚠️ Esto cerrará el cargo actual y abrirá uno nuevo en el historial
              </p>
            )}
          </div>

          {/* Fecha de inicio del nuevo cargo */}
          {form.id_cargo && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Fecha inicio nuevo cargo <span className="text-red-400">*</span>
              </label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={guardando}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60">
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
const Funcionarios = ({ personal }) => {
  const { funcionarios, actions } = personal;
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [cargos, setCargos] = useState([]);
  const [showModalCargo, setShowModalCargo] = useState(false);

  // Modales
  const [modalConceptos, setModalConceptos] = useState(null); // funcionario
  const [modalHistorial, setModalHistorial] = useState(null); // ver historial
  const [modalEditar, setModalEditar] = useState(null); // editar funcionario
  const [modalFamiliar, setModalFamiliar] = useState(null); // funcionario
  const [modalListaFam, setModalListaFam] = useState(null); // funcionario
  const [nuevoFam, setNuevoFam] = useState({ parentesco: '', fecha_nacimiento: '', nombre: '', cedula: '' });
  const [guardandoFam, setGuardandoFam] = useState(false);

  const [form, setForm] = useState({
    nombre: '', apellido: '', ci: '', ruc: '',
    estado_civil: '', sexo: '', fecha_nacimiento: '',
    id_cargo: '', fecha_ingreso: '',
  });

  const cargarCargos = () => {
    api.get(`/cargos`)
      .then(res => setCargos(res.data))
      .catch(() => setCargos([]));
  };

  useEffect(() => { cargarCargos(); }, []);

  const cargoSeleccionado = cargos.find(c => c.id_cargo === Number(form.id_cargo));
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido || !form.ci) {
      setErrorForm('Nombre, apellido y CI son obligatorios.');
      return;
    }
    if (!form.id_cargo) {
      setErrorForm('Debés seleccionar un cargo.');
      return;
    }
    setErrorForm('');
    setGuardando(true);
    try {
      await actions.agregarFuncionario({
        nombre: form.nombre,
        apellido: form.apellido,
        ci: form.ci,
        ruc: form.ruc,
        estado_civil: form.estado_civil,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        id_cargo: Number(form.id_cargo),
        fecha_ingreso: form.fecha_ingreso || null,
        // El salario base viene del cargo, no del form
        salario_base: cargoSeleccionado?.sueldo_base
          ? Number(cargoSeleccionado.sueldo_base)
          : null,
        familiares: [],
      });
      setForm({ nombre: '', apellido: '', ci: '', ruc: '', estado_civil: '', sexo: '', fecha_nacimiento: '', id_cargo: '', fecha_ingreso: '' });
      setShowForm(false);
    } catch {
      setErrorForm('Error al guardar. Revisá los datos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarFamiliar = async () => {
    if (!nuevoFam.parentesco || !nuevoFam.nombre) {
      alert('El nombre y parentesco son obligatorios');
      return;
    }

    setGuardandoFam(true);
    try {
      await axios.post(`${API}/funcionarios/${modalFamiliar.id}/familiares`, {
        parentesco: nuevoFam.parentesco,
        fecha_nacimiento: nuevoFam.fecha_nacimiento || null,
        nombre: nuevoFam.nombre,
        cedula: nuevoFam.cedula || null,
      });
      await actions.recargar();
      setNuevoFam({ parentesco: '', fecha_nacimiento: '', nombre: '', cedula: '' });
      setModalFamiliar(null);
    } catch {
      alert('Error al agregar familiar.');
    } finally {
      setGuardandoFam(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Dar de baja a este funcionario?')) return;
    try { await actions.eliminarFuncionario(id); }
    catch { alert('Error al eliminar.'); }
  };

  const handleCargoCreado = (nuevoCargo) => {
    setCargos(prev => [...prev, nuevoCargo]);
    setForm(prev => ({ ...prev, id_cargo: String(nuevoCargo.id_cargo) }));
  };

  const funcionariosFiltrados = funcionarios.filter(f =>
    f.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    f.documento.includes(filtro)
  );

  return (
    <div className="space-y-6">

      {/* Barra superior */}
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar funcionario por nombre o CI..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-orange-100 focus:ring-2 focus:ring-erp-orange outline-none bg-white transition-all"
            value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
        {puedeEditar('personal') && (
          <div className="flex gap-2">
            <button onClick={() => setShowModalCargo(true)}
              className="border border-orange-200 text-erp-orange px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-50 transition-colors">
              <Settings2 size={18} /> Nuevo Cargo
            </button>
            <button onClick={() => setShowForm(true)}
              className="bg-erp-orange text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
              <UserPlus size={20} /> Nuevo Funcionario
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-50/50 text-erp-orange text-xs font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Datos Personales</th>
              <th className="px-6 py-4">Cargo y Salario</th>
              <th className="px-6 py-4">Núcleo Familiar</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50">
            {funcionariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                  No hay funcionarios registrados.
                </td>
              </tr>
            )}
            {funcionariosFiltrados.map((f) => (
              <tr key={f.id} className="hover:bg-orange-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-erp-orange/10 flex items-center justify-center text-erp-orange font-bold">
                      {f.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{f.nombre}</div>
                      <div className="text-xs text-gray-500 font-medium">CI: {f.documento}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase size={14} className="text-erp-orange" />
                    <span className="font-bold text-gray-700">{f.cargoActual}</span>
                  </div>
                  <div className="text-xs font-black text-erp-orange mt-1">
                    {formatGua(f.salarioBase)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setModalListaFam(f)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                      <Users2 size={14} />
                      Familiares ({f.nucleoFamiliar?.length || 0})
                    </button>

                    {puedeEditar('personal') && (
                      <button onClick={() => setModalFamiliar(f)}
                        className="p-1.5 bg-orange-50 text-erp-orange rounded-lg font-bold hover:bg-orange-100 transition-colors"
                        title="Agregar familiar">
                        <Plus size={16} />
                      </button>
                    )}
                    <button onClick={() => setModalConceptos(f)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                      <CreditCard size={14} /> Conceptos+
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {puedeEditar('personal') && (
                      <>
                        <button
                          onClick={() => setModalHistorial(f)}
                          className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Ver historial de cargos"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => setModalEditar(f)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar funcionario"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleEliminar(f.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Dar de baja">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal Registrar Funcionario ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-orange-100">
            <div className="p-8 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-2xl font-black text-erp-orange uppercase tracking-tighter">Registrar Funcionario</h2>
              <p className="text-sm text-gray-500 font-medium">Complete los datos del nuevo personal</p>
            </div>
            <div className="p-8 grid grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre <span className="text-red-400">*</span></label>
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. Juan" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Apellido <span className="text-red-400">*</span></label>
                <input name="apellido" value={form.apellido} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. Pérez" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">CI <span className="text-red-400">*</span></label>
                <input name="ci" value={form.ci} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. 1234567" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">RUC</label>
                <input name="ruc" value={form.ruc} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" placeholder="Ej. 1234567-0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Sexo</label>
                <select name="sexo" value={form.sexo} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estado Civil</label>
                <select name="estado_civil" value={form.estado_civil} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="">Seleccionar...</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                  <option value="Viudo">Viudo/a</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Ingreso</label>
                <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>
              <div className="col-span-2 space-y-1">
                <div className="flex justify-between items-center ml-1 mb-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">
                    Cargo <span className="text-red-400">*</span>
                  </label>
                  <button type="button" onClick={() => setShowModalCargo(true)}
                    className="text-[10px] font-black text-erp-orange hover:underline flex items-center gap-1 uppercase">
                    <Plus size={11} /> Crear cargo nuevo
                  </button>
                </div>
                <select name="id_cargo" value={form.id_cargo} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="">Seleccionar cargo...</option>
                  {cargos.map(c => (
                    <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>
                  ))}
                </select>
              </div>
              {cargoSeleccionado && (
                <div className="col-span-2 flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
                  <Briefcase size={16} className="text-erp-orange" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Salario base del cargo</p>
                    <p className="text-sm font-black text-erp-orange">{formatGua(Number(cargoSeleccionado.sueldo_base))}</p>
                  </div>
                </div>
              )}
              {errorForm && (
                <div className="col-span-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                  {errorForm}
                </div>
              )}
            </div>
            <div className="p-8 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setErrorForm(''); }} disabled={guardando}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Agregar Familiar ── */}
      {modalFamiliar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-orange-100">
            <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-xl font-black text-erp-orange uppercase tracking-tighter">Agregar Familiar</h2>
              <p className="text-sm text-gray-500 font-medium">Funcionario: {modalFamiliar.nombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre Completo <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej. María López" value={nuevoFam.nombre}
                  onChange={e => setNuevoFam(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cédula de Identidad</label>
                <input type="text" placeholder="Opcional" value={nuevoFam.cedula}
                  onChange={e => setNuevoFam(prev => ({ ...prev, cedula: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Parentesco <span className="text-red-400">*</span></label>
                  <select value={nuevoFam.parentesco}
                    onChange={e => setNuevoFam(prev => ({ ...prev, parentesco: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                    <option value="">Seleccionar...</option>
                    <option value="Cónyuge">Cónyuge</option>
                    <option value="Hijo">Hijo</option>
                    <option value="Hija">Hija</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nacimiento</label>
                  <input type="date" value={nuevoFam.fecha_nacimiento}
                    onChange={e => setNuevoFam(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
              <button onClick={() => { setModalFamiliar(null); setNuevoFam({ parentesco: '', fecha_nacimiento: '', nombre: '', cedula: '' }); }}
                disabled={guardandoFam}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarFamiliar}
                disabled={guardandoFam || !nuevoFam.parentesco || !nuevoFam.nombre}
                className="px-6 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60">
                {guardandoFam ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Listar Familiares ── */}
      {modalListaFam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Núcleo Familiar</h2>
                <p className="text-sm text-gray-500 font-medium">{modalListaFam.nombre}</p>
              </div>
              <button onClick={() => setModalListaFam(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {modalListaFam.nucleoFamiliar?.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">No hay familiares registrados.</div>
              ) : (
                <div className="space-y-3">
                  {modalListaFam.nucleoFamiliar.map((fam, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-100 transition-colors">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{fam.nombre || 'Sin Nombre'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{fam.cedula ? `CI: ${fam.cedula}` : 'Sin CI'}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">
                          {fam.parentesco}
                        </span>
                        {fam.fechaNacimiento && (
                          <div className="text-[10px] font-medium text-gray-400 mt-1">Nac: {fam.fechaNacimiento}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Conceptos Extras ── */}
      {modalConceptos && (
        <ModalConceptos
          funcionario={modalConceptos}
          onClose={() => setModalConceptos(null)}
          actions={actions}
        />
      )}

      {/* ── Modal Historial de Cargos ── */}
      {modalHistorial && (
        <ModalHistorial
          funcionario={modalHistorial}
          onClose={() => setModalHistorial(null)}
        />
      )}

      {/* ── Modal Editar Funcionario ── */}
      {modalEditar && (
        <ModalEditarFuncionario
          funcionario={modalEditar}
          cargos={cargos}
          onClose={() => setModalEditar(null)}
          actions={actions}
        />
      )}

      {/* ── Modal Crear Cargo ── */}
      {showModalCargo && (
        <ModalCrearCargo
          onClose={() => setShowModalCargo(false)}
          onCreado={handleCargoCreado}
        />
      )}

    </div>
  );
};

export default Funcionarios;