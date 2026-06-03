import { useState, useEffect, Fragment } from 'react';
import { BarChart3, Plus, AlertTriangle, CheckCircle, AlertCircle, Calendar, Loader, ChevronDown, ChevronUp, Building } from 'lucide-react';
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
    rangoHasta: ''
  });

  const [filasExpandidas, setFilasExpandidas] = useState({});
  const [mostrarFormPuntoId, setMostrarFormPuntoId] = useState(null);
  const [puntoFormData, setPuntoFormData] = useState({
    cod_establecimiento: '001',
    cod_punto_expedicion: '',
    direccion: ''
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

    if (camposFaltantes.length > 0) {
      setError(`Los siguientes campos son requeridos: ${camposFaltantes.join(', ')}`);
      return;
    }

    if (!/^\d{8}$/.test(formData.numeroTimbrado)) {
      setError('El número de timbrado debe tener exactamente 8 dígitos numéricos');
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
      ...formData
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
        rangoHasta: ''
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
    const puntos = timbrado.puntos_expedicion || [];
    const totalRango = timbrado.rango_hasta - timbrado.rango_desde + 1;
    
    if (puntos.length <= 1) {
      const primerPunto = puntos[0] || { ultimo_secuencial: timbrado.rango_desde - 1, cod_establecimiento: '001', cod_punto_expedicion: '001' };
      const siguienteNumero = primerPunto.ultimo_secuencial + 1;
      const emitidas = siguienteNumero - timbrado.rango_desde;
      const disponibles = timbrado.rango_hasta - siguienteNumero + 1;
      const porcentaje = totalRango > 0 ? Math.round((emitidas / totalRango) * 100) : 0;
      return { 
        esMultiple: false, 
        emitidas, 
        disponibles, 
        total: totalRango, 
        porcentaje, 
        siguienteNumero, 
        puntosCount: puntos.length,
        primerPunto
      };
    } else {
      let totalEmitidas = 0;
      puntos.forEach(p => {
        const emitidasPunto = (p.ultimo_secuencial + 1) - timbrado.rango_desde;
        totalEmitidas += Math.max(0, emitidasPunto);
      });
      const totalAutorizado = totalRango * puntos.length;
      const porcentaje = totalAutorizado > 0 ? Math.round((totalEmitidas / totalAutorizado) * 100) : 0;
      return {
        esMultiple: true,
        emitidas: totalEmitidas,
        disponibles: '—',
        total: totalAutorizado,
        porcentaje,
        siguienteNumero: 'Varios',
        puntosCount: puntos.length,
        primerPunto: puntos[0] || { cod_establecimiento: '001', cod_punto_expedicion: '001' }
      };
    }
  };

  const toggleFila = (id) => {
    setFilasExpandidas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAgregarPunto = async (e, timbradoId) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { cod_establecimiento, cod_punto_expedicion, direccion } = puntoFormData;
    if (!cod_establecimiento || !cod_punto_expedicion) {
      setError('El establecimiento y el punto de expedición son requeridos');
      return;
    }

    if (!/^\d{1,3}$/.test(cod_establecimiento) || !/^\d{1,3}$/.test(cod_punto_expedicion)) {
      setError('El establecimiento y el punto de expedición deben contener solo números (hasta 3 dígitos)');
      return;
    }

    try {
      const response = await fetch(`/api/timbrados/${timbradoId}/puntos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cod_establecimiento,
          cod_punto_expedicion,
          direccion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar punto de expedición');
      }

      setSuccess('Punto de expedición agregado exitosamente');
      setMostrarFormPuntoId(null);
      setPuntoFormData({
        cod_establecimiento: '001',
        cod_punto_expedicion: '',
        direccion: ''
      });
      cargarTimbrados();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePunto = async (timbradoId, puntoId) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/timbrados/${timbradoId}/puntos/${puntoId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado del punto de expedición');
      }

      const data = await response.json();
      setSuccess(data.message);
      cargarTimbrados();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
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
                  <th className="w-12 px-4 py-4 text-center"></th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Número Timbrado</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wider">Puntos de Expedición</th>
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
                  const { esMultiple, emitidas, disponibles, total, porcentaje, siguienteNumero, primerPunto } = calcularEstadisticas(timbrado);
                  const estaExpandido = !!filasExpandidas[timbrado.id];
                  
                  return (
                    <Fragment key={timbrado.id}>
                      <tr 
                        className={`transition-colors border-b border-gray-100 ${estaExpandido ? 'bg-orange-50/10' : vencido ? 'bg-red-50 hover:bg-red-100' : porAlVencer ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-orange-50/30'}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={() => toggleFila(timbrado.id)}
                            className="p-1.5 hover:bg-gray-200/60 rounded-lg transition-colors text-gray-500 hover:text-erp-orange"
                            title={estaExpandido ? "Colapsar puntos de expedición" : "Expandir puntos de expedición"}
                          >
                            {estaExpandido ? <ChevronUp size={16} className="font-bold" /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{timbrado.nro_timbrado}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{timbrado.tipo_documento}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(timbrado.puntos_expedicion || []).map(p => (
                              <span 
                                key={p.id} 
                                className={`inline-block font-mono font-bold text-[10px] px-2 py-0.5 rounded border ${
                                  p.activo 
                                    ? 'bg-orange-50 text-erp-orange border-orange-200' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                                }`}
                                title={p.direccion || ''}
                              >
                                {p.cod_establecimiento}-{p.cod_punto_expedicion}
                              </span>
                            ))}
                            {(!timbrado.puntos_expedicion || timbrado.puntos_expedicion.length === 0) && (
                              <span className="text-xs text-gray-400 italic">Sin puntos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded w-fit">
                            {timbrado.rango_desde.toString().padStart(7, '0')} - {timbrado.rango_hasta.toString().padStart(7, '0')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-erp-orange">
                            {typeof siguienteNumero === 'number' ? siguienteNumero.toString().padStart(7, '0') : siguienteNumero}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                            {emitidas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${typeof disponibles === 'number' && disponibles <= 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
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

                      {/* Fila Expandida de Puntos de Expedición */}
                      {estaExpandido && (
                        <tr className="bg-gray-50/50">
                          <td colSpan="10" className="px-6 py-4 border-t border-b border-gray-100">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                              {/* Cabecera del Panel */}
                              <div className="flex justify-between items-center border-b pb-3">
                                <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                                  <Building className="w-4 h-4 text-erp-orange" />
                                  Puntos de Expedición Autorizados ({timbrado.puntos_expedicion?.length || 0})
                                </h4>
                                {puedeEditar('ventas') && (
                                  <button
                                    onClick={() => {
                                      if (mostrarFormPuntoId === timbrado.id) {
                                        setMostrarFormPuntoId(null);
                                      } else {
                                        setMostrarFormPuntoId(timbrado.id);
                                        setPuntoFormData({
                                          cod_establecimiento: '001',
                                          cod_punto_expedicion: '',
                                          direccion: ''
                                        });
                                      }
                                    }}
                                    className="flex items-center gap-1 text-xs bg-erp-orange/10 hover:bg-erp-orange/20 text-erp-orange font-bold px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    <Plus size={14} />
                                    Agregar Punto
                                  </button>
                                )}
                              </div>

                              {/* Formulario Agregar Punto */}
                              {mostrarFormPuntoId === timbrado.id && (
                                <form 
                                  onSubmit={(e) => handleAgregarPunto(e, timbrado.id)} 
                                  className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 space-y-4 animate-in fade-in duration-200"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Establecimiento *</label>
                                      <input
                                        type="text"
                                        placeholder="Ej: 001"
                                        maxLength="3"
                                        value={puntoFormData.cod_establecimiento}
                                        onChange={(e) => setPuntoFormData(prev => ({ ...prev, cod_establecimiento: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-erp-orange focus:border-transparent bg-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Punto Expedición *</label>
                                      <input
                                        type="text"
                                        placeholder="Ej: 002"
                                        maxLength="3"
                                        value={puntoFormData.cod_punto_expedicion}
                                        onChange={(e) => setPuntoFormData(prev => ({ ...prev, cod_punto_expedicion: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-erp-orange focus:border-transparent bg-white"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Dirección / Sucursal</label>
                                      <input
                                        type="text"
                                        placeholder="Ej: Sucursal San Lorenzo"
                                        value={puntoFormData.direccion}
                                        onChange={(e) => setPuntoFormData(prev => ({ ...prev, direccion: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-erp-orange focus:border-transparent bg-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setMostrarFormPuntoId(null)}
                                      className="px-3 py-1.5 border rounded-lg hover:bg-gray-100 transition-colors font-bold text-gray-600 bg-white"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-erp-orange hover:bg-orange-600 text-white rounded-lg transition-colors font-bold"
                                    >
                                      Guardar Punto
                                    </button>
                                  </div>
                                </form>
                              )}

                              {/* Lista de Puntos */}
                              <div className="overflow-x-auto border rounded-xl">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-bold text-gray-600">Punto</th>
                                      <th className="px-4 py-2 text-left font-bold text-gray-600">Dirección</th>
                                      <th className="px-4 py-2 text-center font-bold text-gray-600">Siguiente #</th>
                                      <th className="px-4 py-2 text-center font-bold text-gray-600">Emitidas</th>
                                      <th className="px-4 py-2 text-center font-bold text-gray-600">Disponibles</th>
                                      <th className="px-4 py-2 text-center font-bold text-gray-600">Utilización</th>
                                      <th className="px-4 py-2 text-center font-bold text-gray-600">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {(timbrado.puntos_expedicion || []).length === 0 ? (
                                      <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-400 italic">
                                          No hay puntos de expedición configurados.
                                        </td>
                                      </tr>
                                    ) : (
                                      timbrado.puntos_expedicion.map(p => {
                                        const sig = p.ultimo_secuencial + 1;
                                        const emi = sig - timbrado.rango_desde;
                                        const disp = timbrado.rango_hasta - sig + 1;
                                        const totalP = timbrado.rango_hasta - timbrado.rango_desde + 1;
                                        const porc = totalP > 0 ? Math.round((emi / totalP) * 100) : 0;
                                        
                                        return (
                                          <tr key={p.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-bold font-mono text-gray-900">
                                              {p.cod_establecimiento}-{p.cod_punto_expedicion}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                              {p.direccion || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono font-bold text-erp-orange">
                                              {sig.toString().padStart(7, '0')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">{emi}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className={`px-2.5 py-0.5 rounded-full font-bold ${disp <= 100 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{disp}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                  <div 
                                                    className={`h-1.5 rounded-full transition-all ${porc < 50 ? 'bg-green-500' : porc < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${porc}%` }}
                                                  ></div>
                                                </div>
                                                <span className="font-bold text-[10px] text-gray-600">{porc}%</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              {puedeEditar('ventas') ? (
                                                <button
                                                  type="button"
                                                  onClick={() => handleTogglePunto(timbrado.id, p.id)}
                                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[10px] transition-all border ${
                                                    p.activo 
                                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                  }`}
                                                >
                                                  {p.activo ? 'Activo' : 'Inactivo'}
                                                </button>
                                              ) : (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[10px] border ${
                                                  p.activo 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                  {p.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
