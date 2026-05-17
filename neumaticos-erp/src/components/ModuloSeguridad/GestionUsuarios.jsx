import { useState, useEffect } from 'react';
import { UserPlus, Save, X, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombreRol: '',
    esAdmin: false
  });
  
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const modulosDisponibles = [
    { id: 'COMPRAS', label: 'Módulo Compras' },
    { id: 'VENTAS', label: 'Módulo Ventas' },
    { id: 'TESORERIA', label: 'Módulo Tesorería' },
    { id: 'CONTABILIDAD', label: 'Módulo Contabilidad' },
    { id: 'PERSONAL', label: 'Módulo Personal/Nómina' },
    { id: 'STOCK', label: 'Módulo Stock' },
    { id: 'SERVICIOS', label: 'Módulo Servicios' },
  ];

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (id) => {
    setPermisosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    let rolFinal = 'ADMIN';

    if (!formData.esAdmin) {
      if (!formData.nombreRol.trim()) {
        setError('Debes ingresar un nombre para el rol personalizado.');
        return;
      }
      if (permisosSeleccionados.length === 0) {
        setError('Debes seleccionar al menos un módulo de acceso.');
        return;
      }
      // Formato: NombreRol|MODULO1,MODULO2
      rolFinal = `${formData.nombreRol.trim().toUpperCase()}|${permisosSeleccionados.join(',')}`;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        rol: rolFinal
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      setMensaje('✅ Usuario creado exitosamente');
      
      // Limpiar y recargar
      setFormData({ username: '', email: '', password: '', nombreRol: '', esAdmin: false });
      setPermisosSeleccionados([]);
      setMostrarModal(false);
      cargarUsuarios();
      
      // Mostrar mensaje temporal
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  };

  const formatearRol = (rolRaw) => {
    if (!rolRaw) return 'SIN ROL';
    if (rolRaw === 'ADMIN') return 'ADMINISTRADOR GLOBAL';
    if (rolRaw.includes('|')) return rolRaw.split('|')[0];
    return rolRaw;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-erp-orange min-h-[80vh]">
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-gray-100">
        <div className="flex items-center gap-3">
          <UserCheck className="text-erp-orange" size={32} />
          <div>
            <h2 className="text-2xl font-black text-gray-800">Gestión de Usuarios</h2>
            <p className="text-gray-500 text-sm">Administra los usuarios del sistema y sus roles</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-erp-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all"
        >
          <UserPlus size={20} />
          Crear Usuario
        </button>
      </div>

      {mensaje && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 font-bold">
          {mensaje}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-800 uppercase font-black text-xs border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Rol Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">No hay usuarios cargados</td>
              </tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id_usuario} className="hover:bg-orange-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-400">#{u.id_usuario}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{u.username}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      u.rol_empresa === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {formatearRol(u.rol_empresa)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-erp-orange" />
                Nuevo Usuario y Permisos
              </h3>
              <button 
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-bold">
                  {error}
                </div>
              )}

              <form id="form-crear-usuario" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de Usuario</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="ej. juanperez"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Correo de la Empresa</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="ej. jperez@empresa.com"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Asigna una contraseña"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-black text-gray-800 mb-4">Configuración de Rol</h4>
                  
                  <label className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer mb-6">
                    <input
                      type="checkbox"
                      name="esAdmin"
                      checked={formData.esAdmin}
                      onChange={handleChange}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-purple-900">Usuario Administrador</p>
                      <p className="text-xs text-purple-700">Tendrá acceso total a todos los módulos del sistema sin restricciones.</p>
                    </div>
                  </label>

                  {!formData.esAdmin && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Rol Personalizado</label>
                        <input
                          type="text"
                          name="nombreRol"
                          value={formData.nombreRol}
                          onChange={handleChange}
                          placeholder="Ej: Supervisor de Ventas, Encargado de Stock..."
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-erp-orange outline-none"
                        />
                      </div>

                      <label className="block text-sm font-bold text-gray-700 mb-3">Módulos Permitidos (Checkboxes)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulosDisponibles.map(mod => (
                          <label key={mod.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-erp-orange transition-colors">
                            <input
                              type="checkbox"
                              checked={permisosSeleccionados.includes(mod.id)}
                              onChange={() => handleCheckboxChange(mod.id)}
                              className="w-5 h-5 text-erp-orange rounded focus:ring-erp-orange cursor-pointer"
                            />
                            <span className="font-medium text-gray-700 text-sm">{mod.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-4">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
              <button
                type="submit"
                form="form-crear-usuario"
                className="flex-1 flex justify-center items-center gap-2 py-3 px-4 bg-erp-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all"
              >
                <Save size={20} />
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
