import { useState, useEffect } from 'react';
import { UserPlus, Search, Briefcase, Trash2, Edit2, Users2, Plus, X } from 'lucide-react';
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

const Funcionarios = ({ personal }) => {
  const { funcionarios, actions } = personal;
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [cargos, setCargos] = useState([]);

  const [modalFamiliar, setModalFamiliar] = useState(null); // guarda el funcionario seleccionado
  const [modalListaFam, setModalListaFam] = useState(null)
  const [nuevoFam, setNuevoFam] = useState({ parentesco: '', fecha_nacimiento: '', nombre: '', cedula: '' });
  const [guardandoFam, setGuardandoFam] = useState(false);

  const [form, setForm] = useState({
    nombre: '', apellido: '', ci: '', ruc: '',
    estado_civil: '', sexo: '', fecha_nacimiento: '',
    id_cargo: '', fecha_ingreso: '',
  });

  // ── Cargar cargos desde la API ──────────────────────────────
  useEffect(() => {
    api.get(`/cargos`)
      .then(res => setCargos(res.data))
      .catch(() => setCargos([]));
  }, []);

  // ── El salario base se toma del cargo seleccionado ──────────
  const cargoSeleccionado = cargos.find(c => c.id_cargo === Number(form.id_cargo));

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      setForm({
        nombre: '', apellido: '', ci: '', ruc: '',
        estado_civil: '', sexo: '', fecha_nacimiento: '',
        id_cargo: '', fecha_ingreso: '',
      });
      setShowForm(false);
    } catch {
      setErrorForm('Error al guardar. Revisá los datos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarFamiliar = async () => {
    // Validamos que por lo menos carguen nombre y parentesco
    if (!nuevoFam.parentesco || !nuevoFam.nombre) {
      alert("El nombre y parentesco son obligatorios");
      return;
    }

    setGuardandoFam(true);
    try {
      await axios.post(`${API}/funcionarios/${modalFamiliar.id}/familiares`, {
        parentesco: nuevoFam.parentesco,
        fecha_nacimiento: nuevoFam.fecha_nacimiento || null,
        nombre: nuevoFam.nombre,
        cedula: nuevoFam.cedula || null
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
          <input
            type="text"
            placeholder="Buscar funcionario por nombre o CI..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-orange-100 focus:ring-2 focus:ring-erp-orange outline-none bg-white transition-all"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        {puedeEditar('personal') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-erp-orange text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            <UserPlus size={20} />
            Nuevo Funcionario
          </button>
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
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => setModalListaFam(f)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                      title="Ver familiares"
                    >
                      <Users2 size={14} />
                      Familiares ({f.nucleoFamiliar?.length || 0})
                    </button>


                    {puedeEditar('personal') && (
                      <button
                        onClick={() => setModalFamiliar(f)}
                        className="p-1.5 bg-orange-50 text-erp-orange rounded-lg font-bold hover:bg-orange-100 transition-colors"
                        title="Agregar familiar"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {puedeEditar('personal') && (
                      <>
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminar(f.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dar de baja"
                        >
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-orange-100">

            <div className="p-8 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-2xl font-black text-erp-orange uppercase tracking-tighter">Registrar Funcionario</h2>
              <p className="text-sm text-gray-500 font-medium">Complete los datos del nuevo personal</p>
            </div>

            <div className="p-8 grid grid-cols-3 gap-5 max-h-[65vh] overflow-y-auto">

              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Ej. Juan" />
              </div>

              {/* Apellido */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Apellido <span className="text-red-400">*</span>
                </label>
                <input name="apellido" value={form.apellido} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Ej. Pérez" />
              </div>

              {/* CI */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  CI <span className="text-red-400">*</span>
                </label>
                <input name="ci" value={form.ci} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Ej. 1234567" />
              </div>

              {/* RUC */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">RUC</label>
                <input name="ruc" value={form.ruc} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  placeholder="Ej. 1234567-0" />
              </div>

              {/* Sexo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Sexo</label>
                <select name="sexo" value={form.sexo} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              {/* Estado Civil */}
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

              {/* Fecha nacimiento */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>

              {/* Fecha ingreso */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fecha de Ingreso</label>
                <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50" />
              </div>

              {/* Selector de Cargo — ocupa las 2 columnas */}
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Cargo <span className="text-red-400">*</span>
                </label>
                <select name="id_cargo" value={form.id_cargo} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50">
                  <option value="">Seleccionar cargo...</option>
                  {cargos.map(c => (
                    <option key={c.id_cargo} value={c.id_cargo}>
                      {c.nombre_cargo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview del salario base según cargo — solo si hay cargo seleccionado */}
              {cargoSeleccionado && (
                <div className="col-span-2 flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
                  <Briefcase size={16} className="text-erp-orange" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Salario base del cargo</p>
                    <p className="text-sm font-black text-erp-orange">
                      {formatGua(Number(cargoSeleccionado.sueldo_base))}
                    </p>
                  </div>
                </div>
              )}

              {errorForm && (
                <div className="col-span-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                  {errorForm}
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowForm(false); setErrorForm(''); }}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-8 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ---------------- MODAL AGREGAR FAMILIAR ---------------- */}
      {modalFamiliar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-orange-100">

            <div className="p-6 border-b border-orange-50 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-xl font-black text-erp-orange uppercase tracking-tighter">
                Agregar Familiar
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Funcionario: {modalFamiliar.nombre}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* NUEVO: Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. María López"
                  value={nuevoFam.nombre}
                  onChange={e => setNuevoFam(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                />
              </div>

              {/* NUEVO: Cédula */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={nuevoFam.cedula}
                  onChange={e => setNuevoFam(prev => ({ ...prev, cedula: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                    Parentesco <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={nuevoFam.parentesco}
                    onChange={e => setNuevoFam(prev => ({ ...prev, parentesco: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Cónyuge">Cónyuge</option>
                    <option value="Hijo">Hijo</option>
                    <option value="Hija">Hija</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                    Nacimiento (Para Bonificación)
                  </label>
                  <input
                    type="date"
                    value={nuevoFam.fecha_nacimiento}
                    onChange={e => setNuevoFam(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-erp-orange outline-none bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-orange-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalFamiliar(null);
                  setNuevoFam({ parentesco: '', fecha_nacimiento: '', nombre: '', cedula: '' });
                }}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                disabled={guardandoFam}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarFamiliar}
                disabled={guardandoFam || !nuevoFam.parentesco || !nuevoFam.nombre}
                className="px-6 py-3 bg-erp-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-60"
              >
                {guardandoFam ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL LISTAR FAMILIARES ---------------- */}
      {modalListaFam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">
                  Núcleo Familiar
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  {modalListaFam.nombre}
                </p>
              </div>
              <button
                onClick={() => setModalListaFam(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {modalListaFam.nucleoFamiliar?.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">
                  No hay familiares registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {modalListaFam.nucleoFamiliar.map((fam, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-100 transition-colors">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">
                          {fam.nombre || "Sin Nombre"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fam.cedula ? `CI: ${fam.cedula}` : "Sin CI"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">
                          {fam.parentesco}
                        </span>
                        {fam.fechaNacimiento && (
                          <div className="text-[10px] font-medium text-gray-400 mt-1">
                            Nac: {fam.fechaNacimiento}
                          </div>
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
    </div>
  );
};



export default Funcionarios;