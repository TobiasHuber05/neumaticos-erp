import { useState } from 'react';
import { X, Save, Package } from 'lucide-react';

const formatPrecioGs = (valor) => {
    if (!valor) return '';
    const limpio = String(valor).replace(/\./g, '').replace(/,/g, '').trim();
    const n = Number(limpio);
    if (!Number.isFinite(n) || n < 0) return valor;
    return n.toLocaleString('de-DE');
};

const ServicesForm = ({ onCancelar, onGuardar }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');   
    const [duracion_aprox, setDuracion] = useState('');

    const handleGuardar = () => {
        const nombreTrim = nombre.trim();
        const duracionTrim = duracion_aprox.trim();
        if (!nombreTrim || !duracionTrim) return;
        
        onGuardar({
            nombre: nombreTrim,
            precio: precio, // useServicios se encargará de limpiar los puntos
            duracion_aprox: duracionTrim,
        });
    };

    return (
    <div className="bg-white rounded-xl shadow-2xl border border-orange-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-erp-orange p-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                <Package size={20} />
                Nuevo servicio disponible
            </h2>
            <button
                type="button"
                onClick={onCancelar}
                className="text-white hover:bg-orange-600 rounded-full p-1"
                aria-label="Cerrar"
                >
                <X size={24} />
            </button>
        </div>

        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-orange-800 mb-1">Nombre del servicio</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Alineacion de neumaticos"
                        className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-orange-800 mb-1">Precio (Gs.)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={precio}
                        onChange={(e) => setPrecio(formatPrecioGs(e.target.value))}
                        placeholder="Ej: 120.000"
                        className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-orange-800 mb-1">Duración aproximada</label>
                    <input
                        type="text"
                        value={duracion_aprox}
                        onChange={(e) => setDuracion(e.target.value)}
                        placeholder="Ej: 30 min"
                        className="w-full p-2 border border-orange-300 rounded focus:ring-2 focus:ring-erp-orange outline-none bg-white"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancelar}
                    className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleGuardar}
                    className="px-6 py-2 bg-erp-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 flex items-center gap-2"
                >
                <Save size={20} />
                    Guardar servicio
                </button>
            </div>
        </div>
    </div>
  );
};

export default ServicesForm;
