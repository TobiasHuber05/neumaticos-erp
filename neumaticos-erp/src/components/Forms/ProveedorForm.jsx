import { useEffect, useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { CATEGORIAS_PRODUCTO } from '../../data/erpInitialData';

const empty = {
  nombre: '',
  ruc: '',
  contacto: '',
  direccion: '',
  telefono: '',
  categorias: [],
};

/**
 * Alta/edición de proveedor con múltiples categorías (multi-select).
 * Pasá `initial` para modo edición; `onGuardar` recibe el objeto listo.
 */
const ProveedorForm = ({ initial = null, onCancelar, onGuardar }) => {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre ?? '',
        ruc: initial.ruc ?? '',
        contacto: initial.contacto ?? '',
        direccion: initial.direccion ?? '',
        telefono: initial.telefono ?? '',
        categorias: [...(initial.categorias ?? (initial.categoria ? [initial.categoria] : []))],
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  const toggleCategoria = (cat) => {
    setForm((f) => {
      const set = new Set(f.categorias);
      if (set.has(cat)) set.delete(cat);
      else set.add(cat);
      return { ...f, categorias: [...set] };
    });
  };

  const handleGuardar = () => {
    if (!form.nombre?.trim() || !form.ruc?.trim() || !form.contacto?.trim() || !form.direccion?.trim() || !form.telefono?.trim())
      return;
    if (!form.categorias.length) return;
    onGuardar({
      ...(initial?.id ? { id: initial.id } : {}),
      nombre: form.nombre.trim(),
      ruc: form.ruc.trim(),
      contacto: form.contacto.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
      categorias: form.categorias,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-erp-orange p-4 flex justify-between items-center">
        <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
          <Building2 size={20} />
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h2>
        <button type="button" onClick={onCancelar} className="text-white hover:bg-orange-600 rounded-full p-1">
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Razón social</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
              placeholder="Nombre de la empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">RUC</label>
            <input
              type="text"
              value={form.ruc}
              onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
              placeholder="1234567-0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contacto</label>
            <input
              type="text"
              value={form.contacto}
              onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Categorías que el proveedor puede vender
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_PRODUCTO.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    form.categorias.includes(cat)
                      ? 'bg-erp-orange text-white border-erp-orange'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-erp-orange'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {!form.categorias.length && (
              <p className="text-xs text-red-600 mt-2">Seleccioná al menos una categoría.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="px-6 py-2 text-gray-600 font-semibold bg-orange-100 hover:bg-orange-200 rounded-lg">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2"
          >
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProveedorForm;
