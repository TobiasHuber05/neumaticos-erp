import { prisma } from '../../lib/prisma.js';

export const getTimbrados = async (req, res) => {
  try {
    const timbrados = await prisma.Timbrado.findMany({
      include: {
        puntos_expedicion: {
          include: {
            factura_venta: {
              select: {
                id_factura_venta: true,
                nro_factura: true,
                fecha_emision: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(timbrados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTimbradoById = async (req, res) => {
  const { id } = req.params;

  try {
    const timbrado = await prisma.Timbrado.findUnique({
      where: { id: parseInt(id) },
      include: {
        puntos_expedicion: {
          include: {
            factura_venta: {
              select: {
                id_factura_venta: true,
                nro_factura: true,
                fecha_emision: true,
                total: true,
                contado_credito: true
              }
            }
          }
        }
      }
    });

    if (!timbrado) {
      return res.status(404).json({ error: 'Timbrado no encontrado' });
    }

    res.json(timbrado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearTimbrado = async (req, res) => {
  console.log('--- crearTimbrado body received ---:', req.body);
  const {
    numeroTimbrado,
    fechaInicio,
    fechaVencimiento,
    rangoDesde,
    rangoHasta,
    establecimiento = '001',
    puntoExpedicion = '001'
  } = req.body;

  try {
    // Validar datos requeridos
    if (!numeroTimbrado || !fechaInicio || !fechaVencimiento || !rangoDesde || !rangoHasta) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: numeroTimbrado, fechaInicio, fechaVencimiento, rangoDesde, rangoHasta'
      });
    }

    // Validar que el rango sea válido
    const desde = parseInt(rangoDesde);
    const hasta = parseInt(rangoHasta);
    if (desde >= hasta) {
      return res.status(400).json({
        error: 'El rango es inválido: rangoDesde debe ser menor que rangoHasta'
      });
    }

    // Validar que las fechas sean válidas
    const inicio = new Date(fechaInicio);
    const vencimiento = new Date(fechaVencimiento);

    if (inicio >= vencimiento) {
      return res.status(400).json({
        error: 'La fecha de inicio debe ser anterior a la fecha de vencimiento'
      });
    }

    // Verificar que no exista un timbrado con el mismo número
    const timbradoExistente = await prisma.Timbrado.findFirst({
      where: { nro_timbrado: numeroTimbrado }
    });

    if (timbradoExistente) {
      return res.status(400).json({
        error: `Ya existe un timbrado con el número ${numeroTimbrado}`
      });
    }

    // Crear el nuevo timbrado y su punto de expedición por defecto dentro de una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoTimbrado = await tx.Timbrado.create({
        data: {
          nro_timbrado: numeroTimbrado,
          fecha_inicio: inicio,
          fecha_fin: vencimiento,
          rango_desde: desde,
          rango_hasta: hasta,
          tipo_documento: 'FACTURA',
          estado: true
        }
      });

      const nuevoPunto = await tx.PuntoExpedicion.create({
        data: {
          idTimbrado: nuevoTimbrado.id,
          cod_establecimiento: establecimiento,
          cod_punto_expedicion: puntoExpedicion,
          ultimo_secuencial: desde - 1,
          activo: true
        }
      });

      return { nuevoTimbrado, nuevoPunto };
    });

    res.status(201).json({
      message: 'Timbrado creado exitosamente',
      timbrado: {
        ...resultado.nuevoTimbrado,
        puntos_expedicion: [resultado.nuevoPunto]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarTimbrado = async (req, res) => {
  const { id } = req.params;
  const { estado, fechaVencimiento } = req.body;

  try {
    const timbrado = await prisma.Timbrado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!timbrado) {
      return res.status(404).json({ error: 'Timbrado no encontrado' });
    }

    const datosActualizados = {};

    if (estado !== undefined) {
      datosActualizados.estado = estado;
    }

    if (fechaVencimiento !== undefined) {
      const nuevaFecha = new Date(fechaVencimiento);
      if (nuevaFecha <= timbrado.fecha_inicio) {
        return res.status(400).json({
          error: 'La fecha de vencimiento debe ser posterior a la fecha de inicio'
        });
      }
      datosActualizados.fecha_fin = nuevaFecha;
    }

    const timbradoActualizado = await prisma.Timbrado.update({
      where: { id: parseInt(id) },
      data: datosActualizados
    });

    res.json({
      message: 'Timbrado actualizado exitosamente',
      timbrado: timbradoActualizado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerEstadoTimbrado = async (req, res) => {
  const { id } = req.params;

  try {
    const timbrado = await prisma.Timbrado.findUnique({
      where: { id: parseInt(id) },
      include: { puntos_expedicion: true }
    });

    if (!timbrado) {
      return res.status(404).json({ error: 'Timbrado no encontrado' });
    }

    // Usar el primer punto de expedición o calcular estadísticas agregadas
    const primerPunto = timbrado.puntos_expedicion[0] || { ultimo_secuencial: timbrado.rango_desde - 1 };
    const siguienteNumero = primerPunto.ultimo_secuencial + 1;

    const numeroFacturasEmitidas = siguienteNumero - timbrado.rango_desde;
    const numeroFacturasDisponibles = timbrado.rango_hasta - siguienteNumero + 1;
    const porcentajeUtilizado = ((numeroFacturasEmitidas / (timbrado.rango_hasta - timbrado.rango_desde + 1)) * 100).toFixed(2);

    const estado = {
      id: timbrado.id,
      numeroTimbrado: timbrado.nro_timbrado,
      activo: timbrado.estado,
      rangoDesde: timbrado.rango_desde,
      rangoHasta: timbrado.rango_hasta,
      siguienteNumero,
      numeroFacturasEmitidas,
      numeroFacturasDisponibles,
      porcentajeUtilizado: `${porcentajeUtilizado}%`,
      fechaInicio: timbrado.fecha_inicio,
      fechaVencimiento: timbrado.fecha_fin,
      diasRestantes: Math.ceil((new Date(timbrado.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24)),
      vencido: new Date() > new Date(timbrado.fecha_fin)
    };

    res.json(estado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const agregarPuntoExpedicion = async (req, res) => {
  const { id } = req.params;
  const { cod_establecimiento, cod_punto_expedicion, direccion } = req.body;

  try {
    if (!cod_establecimiento || !cod_punto_expedicion) {
      return res.status(400).json({
        error: 'Establecimiento y punto de expedición son requeridos'
      });
    }

    if (!/^\d{1,3}$/.test(cod_establecimiento) || !/^\d{1,3}$/.test(cod_punto_expedicion)) {
      return res.status(400).json({
        error: 'El establecimiento y punto de expedición deben contener solo números (hasta 3 dígitos)'
      });
    }

    const timbradoId = parseInt(id);
    const timbrado = await prisma.Timbrado.findUnique({
      where: { id: timbradoId }
    });

    if (!timbrado) {
      return res.status(404).json({ error: 'Timbrado no encontrado' });
    }

    const prefijoEst = cod_establecimiento.padStart(3, '0');
    const prefijoExp = cod_punto_expedicion.padStart(3, '0');

    // Verificar si ya existe ese punto de expedición para este timbrado
    const puntoExistente = await prisma.PuntoExpedicion.findFirst({
      where: {
        idTimbrado: timbradoId,
        cod_establecimiento: prefijoEst,
        cod_punto_expedicion: prefijoExp
      }
    });

    if (puntoExistente) {
      return res.status(400).json({
        error: `El punto de expedición ${prefijoEst}-${prefijoExp} ya existe en este timbrado`
      });
    }

    const nuevoPunto = await prisma.PuntoExpedicion.create({
      data: {
        idTimbrado: timbradoId,
        cod_establecimiento: prefijoEst,
        cod_punto_expedicion: prefijoExp,
        ultimo_secuencial: timbrado.rango_desde - 1,
        direccion: direccion || null,
        activo: true
      }
    });

    res.status(201).json({
      message: 'Punto de expedición agregado exitosamente',
      punto: nuevoPunto
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const togglePuntoExpedicion = async (req, res) => {
  const { id, puntoId } = req.params;

  try {
    const punto = await prisma.PuntoExpedicion.findUnique({
      where: { id: parseInt(puntoId) }
    });

    if (!punto || punto.idTimbrado !== parseInt(id)) {
      return res.status(404).json({ error: 'Punto de expedición no encontrado' });
    }

    const puntoActualizado = await prisma.PuntoExpedicion.update({
      where: { id: punto.id },
      data: {
        activo: !punto.activo
      }
    });

    res.json({
      message: `Punto de expedición ${puntoActualizado.activo ? 'activado' : 'desactivado'} exitosamente`,
      punto: puntoActualizado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

