import { useState, useEffect } from 'react';
import { BarChart3, Plus, AlertTriangle, CheckCircle, AlertCircle, Calendar, Loader } from 'lucide-react';
import { puedeEditar } from '../../utils/permisos';

const GestionTimbrados = () => {
  const [timbrados, setTimbrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    numeroTimbrado: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    rangoDesde: '',
    rangoHasta: '',
    establecimiento: '001',
    puntoExpedicion: '001'
  });

// carga de timbrados
  useEffect(() => {
    console.log(' GestionTimbrados montado, llamando API...');
    cargarTimbrados();
  }, []);

  const cargarTimbrados = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timbrados', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar timbrados');
      const data = await response.json();
      setTimbrados(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validaciones
    const camposFaltantes = [];
    if (!formData.numeroTimbrado) camposFaltantes.push('Número Timbrado');
    if (!formData.fechaInicio) camposFaltantes.push('Fecha Inicio');
    if (!formData.fechaVencimiento) camposFaltantes.push('Fecha Vencimiento');
    if (!formData.rangoDesde) camposFaltantes.push('Rango Desde');
    if (!formData.rangoHasta) camposFaltantes.push('Rango Hasta');
    if (!formData.establecimiento) camposFaltantes.push('Establecimiento');
    if (!formData.puntoExpedicion) camposFaltantes.push('Punto de Expedición');

    if (camposFaltantes.length > 0) {
      setError(`Los siguientes campos son requeridos: ${camposFaltantes.join(', ')}`);
      return;
    }

    if (!/^\d{8}$/.test(formData.numeroTimbrado)) {
      setError('El número de timbrado debe tener exactamente 8 dígitos numéricos');
      return;
    }

    if (!/^\d{1,3}$/.test(formData.establecimiento) || !/^\d{1,3}$/.test(formData.puntoExpedicion)) {
      setError('El establecimiento y el punto de expedición deben contener solo números (hasta 3 dígitos)');
      return;
    }

    const desde = parseInt(formData.rangoDesde);
    const hasta = parseInt(formData.rangoHasta);
    if (isNaN(desde) || isNaN(hasta) || desde <= 0 || hasta <= 0) {
      setError('Los rangos de facturación deben ser números enteros positivos mayores a cero');
      return;
    }

    if (desde >= hasta) {
      setError('El rango inicial debe ser menor que el rango final');
      return;
    }

    const inicio = new Date(formData.fechaInicio);
    const vencimiento = new Date(formData.fechaVencimiento);
    if (inicio >= vencimiento) {
      setError('La fecha de inicio debe ser anterior a la fecha de vencimiento');
      return;
    }

    const payload = {
      ...formData,
      establecimiento: formData.establecimiento.padStart(3, '0'),
      puntoExpedicion: formData.puntoExpedicion.padStart(3, '0')
    };

    try {
      const response = await fetch('/api/timbrados', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear timbrado');
      }

      setSuccess('Timbrado creado exitosamente');
      setError(null);
      setFormData({
        numeroTimbrado: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaVencimiento: '',
        rangoDesde: '',
        rangoHasta: '',
        establecimiento: '001',
        puntoExpedicion: '001'
      });
      setMostrarFormulario(false);
      cargarTimbrados();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const calcularEstado = (timbrado) => {
    const ahora = new Date();
    const vencimiento = new Date(timbrado.fecha_fin);
    const diasRestantes = Math.ceil((vencimiento - ahora) / (1000 * 60 * 60 * 24));
    const vencido = ahora > vencimiento;
    const porAlVencer = diasRestantes <= 30 && diasRestantes > 0;
    
    return { diasRestantes, vencido, porAlVencer };
  };

  const calcularEstadisticas = (timbrado) => {
    const primerPunto = timbrado.puntos_expedicion?.[0] || { ultimo_secuencial: timbrado.rango_desde - 1 };
    const siguienteNumero = primerPunto.ultimo_secuencial + 1;
    const emitidas = siguienteNumero - timbrado.rango_desde;
    const disponibles = timbrado.rango_hasta - siguienteNumero + 1;
    const total = timbrado.rango_hasta - timbrado.rango_desde + 1;
    const porcentaje = total > 0 ? Math.round((emitidas / total) * 100) : 0;
    
    return { emitidas, disponibles, total, porcentaje, siguienteNumero, primerPunto };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-erp-orange/10 rounded-xl">
            <BarChart3 className="w-8 h-8 text-erp-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Timbrados</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Control de numeración de facturas</p>
          </div>
        </div>

        {puedeEditar('ventas') && (
          <button
            onClick={() => {
              setError(null);
              setSuccess(null);
              setMostrarFormulario(true);
            }}
            className="flex items-center gap-2 bg-erp-orange text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md shrink-0"
          >
            <Plus size={18} />
            Nuevo Timbrado
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="font-bold text-green-900">{success}</p>
        </div>
      )}

      {/* Tabla Timbrados */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-erp-orange animate-spin" />
          </div>
        ) : timbrados.length === 0 ? (
          <div className="px-6 py-20 text-center text-gray-400">
            <BarChart3 className="mx-auto w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-bold mb-1">No hay timbrados registrados</p>
            <p className="text-sm">Cree el primero usando el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Número Timbrado</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Rango</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Siguiente #</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Emitidas</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Disponibles</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Utilización</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Vencimiento</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700 uppercase text-xs tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timbrados.map((timbrado) => {
                  const { diasRestantes, vencido, porAlVencer } = calcularEstado(timbrado);
                  const { emitidas, disponibles, total, porcentaje, siguienteNumero, primerPunto } = calcularEstadisticas(timbrado);
                  
                  return (
                    <tr 
                      key={timbrado.id} 
                      className={`transition-colors ${vencido ? 'bg-red-50 hover:bg-red-100' : porAlVencer ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-orange-50/30'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{timbrado.nro_timbrado}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Est: {primerPunto.cod_establecimiento} | Pto: {primerPunto.cod_punto_expedicion}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded w-fit">
                          {timbrado.rango_desde.toString().padStart(7, '0')} - {timbrado.rango_hasta.toString().padStart(7, '0')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-erp-orange">
                          {siguienteNumero.toString().padStart(7, '0')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                          {emitidas}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${disponibles <= 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {disponibles}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${porcentaje < 50 ? 'bg-green-500' : porcentaje < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 w-8">{porcentaje}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(timbrado.fecha_fin).toLocaleDateString('es-PY')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {vencido ? 'VENCIDO' : `${Math.abs(diasRestantes)} días`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {vencido ? (
                          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold text-xs">
                            <AlertTriangle size={14} />
                            VENCIDO
                          </div>
                        ) : porAlVencer ? (
                          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-xs">
                            <AlertCircle size={14} />
                            POR VENCER
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-xs">
                            <CheckCircle size={14} />
                            ACTIVO
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-erp-orange to-orange-600 px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Plus size={24} />
                Nuevo Timbrado
              </h3>
              <button
                onClick={() => {
                  setError(null);
                  setMostrarFormulario(false);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 text-sm">{error}</p>
                  </div>
                </div>
              )}
              {/* Número Timbrado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Número Timbrado *
                </label>
                <input
                  type="text"
                  name="numeroTimbrado"
                  value={formData.numeroTimbrado}
                  onChange={handleInputChange}
                  placeholder="Ej: 12345678"
                  maxLength="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent font-mono"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Fecha Vencimiento *
                  </label>
                  <input
                    type="date"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rango */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Rango Desde *
                  </label>
                  <input
                    type="number"
                    name="rangoDesde"
                    value={formData.rangoDesde}
                    onChange={handleInputChange}
                    placeholder="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Rango Hasta *
                  </label>
                  <input
                    type="number"
                    name="rangoHasta"
                    value={formData.rangoHasta}
                    onChange={handleInputChange}
                    placeholder="9999999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Establecimiento y Punto Expedición */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Establecimiento
                  </label>
                  <input
                    type="text"
                    name="establecimiento"
                    value={formData.establecimiento}
                    onChange={handleInputChange}
                    maxLength="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Punto Expedición
                  </label>
                  <input
                    type="text"
                    name="puntoExpedicion"
                    value={formData.puntoExpedicion}
                    onChange={handleInputChange}
                    maxLength="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-erp-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMostrarFormulario(false);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-erp-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  Crear Timbrado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTimbrados;
