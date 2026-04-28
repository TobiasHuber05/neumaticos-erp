import { useState } from 'react';
import { UserPlus, X, Mail, Calendar, FileText } from 'lucide-react';

/**
 * Formulario para nuevo cliente. Llama onGuardar con nuevo cliente object.
 * Campos: nombre, apellido, documento/RUC, fechaNacimiento, email
 */
const ClienteForm = ({ onCancelar, onGuardar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fechaNacimiento: '',
    correo: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido || !formData.documento || !formData.correo) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      setError('Email inválido');
      return;
    }
    onGuardar(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-erp-orange/10 p-3 rounded-xl">
              <UserPlus className="text-erp-orange w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800">Nuevo Cliente</h3>
              <p className="text-sm text-gray-500">Registre datos completos</p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                Nombre
              </label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                Apellido
              </label>
              <input
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
              Documento / RUC
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent text-sm"
                placeholder="4.567.890-1 o 80012345-0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                Fecha Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all border border-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-erp-orange hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;

