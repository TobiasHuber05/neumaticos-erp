import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Plus, Edit, Trash2, X, Save, KeyRound, Search } from 'lucide-react';

import {
  getModulosAdicionalesDisponibles,
  describirModulosCargo,
  filtrarPermisosExtra,
} from '../../utils/permisos';

export default function UsuariosModulo() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, usuario: null });
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const [formData, setFormData] = useState({
    id_usuario: null,
    username: '',
    email: '',
    telefono: '',
    id_cargo: '',
    password: '',
    permisos: {},
  });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const nombreCargoSeleccionado = useMemo(() => {
    const c = cargos.find((x) => String(x.id_cargo) === String(formData.id_cargo));
    return c?.nombre_cargo || '';
  }, [cargos, formData.id_cargo]);

  const modulosAdicionales = useMemo(
    () => getModulosAdicionalesDisponibles(nombreCargoSeleccionado),
    [nombreCargoSeleccionado]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsers, resCargos] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/usuarios`, { headers: getHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/cargos`, { headers: getHeaders() })
      ]);
      const dataUsers = await resUsers.json();
      const dataCargos = await resCargos.json();
      setUsuarios(dataUsers);
      setCargos(dataCargos);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      const cargoNombre = usuario.cargos?.nombre_cargo || usuario.rol_empresa || '';
      setFormData({
        id_usuario: usuario.id_usuario,
        username: usuario.username || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        id_cargo: usuario.cargos?.id_cargo || usuario.id_cargo || '',
        password: '',
        permisos: usuario.permisos || {},
      });
    } else {
      setFormData({
        id_usuario: null,
        username: '',
        email: '',
        telefono: '',
        id_cargo: '',
        password: '',
        permisos: {},
      });
    }
    setModalOpen(true);
  };

  const handleCargoChange = (id_cargo) => {
    const cargo = cargos.find((c) => String(c.id_cargo) === String(id_cargo));
    const nombre = cargo?.nombre_cargo || '';
    setFormData((prev) => ({
      ...prev,
      id_cargo,
      permisos: filtrarPermisosExtra(prev.permisos, nombre),
    }));
  };

  const handlePermisoChange = (moduloId, tipo, value) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [moduloId]: {
          ...(prev.permisos[moduloId] || { ver: false, editar: false }),
          [tipo]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cargo = cargos.find((c) => String(c.id_cargo) === String(formData.id_cargo));
      const payload = {
        ...formData,
        permisos: filtrarPermisosExtra(formData.permisos, cargo?.nombre_cargo || ''),
      };

      const url = formData.id_usuario
        ? `${import.meta.env.VITE_API_URL || ''}/api/usuarios/${formData.id_usuario}`
        : `${import.meta.env.VITE_API_URL || ''}/api/usuarios`;

      const method = formData.id_usuario ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchData();
        setModalOpen(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/usuarios/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (res.ok) fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleOpenReset = (usuario) => {
    setResetModal({ open: true, usuario });
    setNewPassword('');
    setResetMsg(null);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetMsg({ tipo: 'err', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password-admin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          id_usuario: resetModal.usuario.id_usuario,
          newPassword,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setResetMsg({ tipo: 'err', text: data.error || 'Error al resetear contraseña' });
        return;
      }

      setResetMsg({ tipo: 'ok', text: data.message });
      setNewPassword('');
    } catch (error) {
      setResetMsg({ tipo: 'err', text: 'Error de conexión' });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando usuarios...</div>;

  const usuariosFiltrados = usuarios.filter(u =>
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.cargos?.nombre_cargo || u.rol_empresa || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const usuariosPagina = usuariosFiltrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
          <Shield className="text-erp-orange" size={28} /> Gestión de Usuarios y Permisos
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-erp-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-orange-500/30 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4 relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o cargo..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-erp-orange outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase text-xs sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuariosPagina.map(u => (
                <tr key={u.id_usuario} className="hover:bg-orange-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-800">{u.username}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600">{u.telefono || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {u.cargos?.nombre_cargo || u.rol_empresa || 'Sin Cargo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenReset(u)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                      title="Resetear contraseña"
                    >
                      <KeyRound size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(u)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id_usuario)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosPagina.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                    {busqueda ? 'No se encontraron usuarios con esa búsqueda.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Mostrando {(paginaSegura - 1) * POR_PAGINA + 1}–{Math.min(paginaSegura * POR_PAGINA, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${n === paginaSegura ? 'bg-erp-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal resetear contraseña */}
      {resetModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-amber-50">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <KeyRound className="text-amber-600" size={20} />
                Resetear contraseña — {resetModal.usuario?.username}
              </h3>
              <button
                onClick={() => setResetModal({ open: false, usuario: null })}
                className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {resetMsg && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${resetMsg.tipo === 'ok'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                  {resetMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModal({ open: false, usuario: null })}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  <KeyRound size={16} /> Resetear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar usuario */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                {formData.id_usuario ? <Edit className="text-erp-orange" /> : <Plus className="text-erp-orange" />}
                {formData.id_usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Username *</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-erp-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium text-gray-800" placeholder="Ej: jdoe" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-erp-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium text-gray-800" placeholder="correo@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-erp-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium text-gray-800" placeholder="09XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Cargo *</label>
                  <select required value={formData.id_cargo} onChange={e => handleCargoChange(e.target.value)} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-erp-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium text-gray-800 appearance-none">
                    <option value="">Seleccione un cargo...</option>
                    {cargos.map(c => (
                      <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>
                    ))}
                  </select>
                </div>
                {!formData.id_usuario && (
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Contraseña *</label>
                    <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-erp-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium text-gray-800" placeholder="••••••••" />
                  </div>
                )}
              </div>

              {formData.id_usuario && formData.id_cargo && (
                <>
                  <div className="mb-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-xs font-black text-erp-orange uppercase tracking-wider mb-1">Módulos del cargo (fijos)</p>
                    <p className="text-sm text-gray-700 font-medium">{describirModulosCargo(nombreCargoSeleccionado)}</p>
                    <p className="text-xs text-gray-500 mt-2">Definidos por el cargo. No se modifican desde aquí.</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-black text-gray-800">Módulos adicionales</h4>
                    <p className="text-sm text-gray-500 font-medium mt-1">Otorgá acceso extra a módulos que no incluye el cargo.</p>
                  </div>

                  {modulosAdicionales.length === 0 ? (
                    <p className="text-sm text-gray-500 font-medium p-4 bg-gray-50 rounded-xl border border-gray-100">
                      Este cargo ya tiene acceso a todos los módulos del sistema.
                    </p>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="py-3 px-4 text-gray-500 font-bold uppercase text-xs">Módulo adicional</th>
                            <th className="py-3 px-4 text-center text-gray-500 font-bold uppercase text-xs">Puede Ver</th>
                            <th className="py-3 px-4 text-center text-gray-500 font-bold uppercase text-xs">Puede Editar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {modulosAdicionales.map(mod => {
                            const perm = formData.permisos[mod.id] || { ver: false, editar: false };
                            return (
                              <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-4 font-bold text-gray-700">{mod.label}</td>
                                <td className="py-4 px-4 text-center">
                                  <input type="checkbox" checked={perm.ver}
                                    onChange={(e) => {
                                      handlePermisoChange(mod.id, 'ver', e.target.checked);
                                      if (!e.target.checked) handlePermisoChange(mod.id, 'editar', false);
                                    }}
                                    className="w-5 h-5 text-erp-orange border-gray-300 rounded focus:ring-erp-orange cursor-pointer"
                                  />
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <input type="checkbox" checked={perm.editar}
                                    onChange={(e) => {
                                      handlePermisoChange(mod.id, 'editar', e.target.checked);
                                      if (e.target.checked) handlePermisoChange(mod.id, 'ver', true);
                                    }}
                                    className="w-5 h-5 text-erp-orange border-gray-300 rounded focus:ring-erp-orange cursor-pointer"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all active:scale-95">
                  Cancelar
                </button>
                <button type="submit" className="bg-erp-orange hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95">
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}