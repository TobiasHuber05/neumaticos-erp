import { prisma } from '../lib/prisma.js';

/**
 * Genera un asiento contable a partir de un modelo de asiento configurable.
 *
 * @param {Object} params
 * @param {string} params.operacion_asiento - Identificador único del modelo (ej: 'VENTA_FACTURA')
 * @param {Date}   params.fecha - Fecha del asiento
 * @param {string} params.descripcion - Descripción del asiento
 * @param {string} params.tabla_origen - Tabla que origina el asiento
 * @param {number} params.id_registro_origen - ID del registro origen
 * @param {number[]} params.montos - Array de montos en el MISMO ORDEN que las líneas del modelo
 * @param {number} [params.cuentaBancariaId] - Opcional: ID de cuenta bancaria para reemplazar líneas de banco
 * @param {import('@prisma/client').Prisma.TransactionClient|null} txClient
 * @param {{ strict?: boolean }} options
 */
export const generarAsientoPorModelo = async (params, txClient = null, options = {}) => {
  const db = txClient || prisma;
  const { strict = false } = options;
  const {
    operacion_asiento,
    fecha,
    descripcion,
    tabla_origen,
    id_registro_origen,
    montos,
    cuentaBancariaId,
  } = params;

  try {
    // 1. Buscar el modelo
    const modelo = await db.modelo_asiento.findFirst({
      where: { operacion_asiento },
      include: {
        detalle_modelo_asiento: {
          orderBy: { item: 'asc' },
        },
      },
    });

    if (!modelo || !modelo.detalle_modelo_asiento?.length) {
      const msg = `No se encontró modelo de asiento configurado para: ${operacion_asiento}. Configuralo en Contabilidad > Modelos de Asientos.`;
      if (strict) throw new Error(msg);
      console.warn(`⚠️ ${msg}`);
      return null;
    }

    // 2. Buscar periodo activo
    const periodoActivo = await db.proceso_contable.findFirst({
      where: { estado: 'Abierto' },
      orderBy: { fecha_inicio: 'desc' },
    });

    if (!periodoActivo) {
      const msg = 'No hay un periodo contable abierto. Abrí un periodo en Contabilidad antes de registrar movimientos.';
      if (strict) throw new Error(msg);
      console.warn(`⚠️ ${msg}`);
      return null;
    }

    // 3. Si hay cuenta bancaria, obtener su cuenta contable vinculada
    let cuentaContableBancaria = null;
    if (cuentaBancariaId) {
      const cb = await db.cuenta_bancaria.findUnique({
        where: { id_cuenta: Number(cuentaBancariaId) },
      });
      if (cb?.id_cuenta_contable) {
        cuentaContableBancaria = cb.id_cuenta_contable;
      }
    }

    // 4. Construir detalles con cuentas desde el modelo
    const detallesConId = modelo.detalle_modelo_asiento.map((det, i) => {
      const monto = montos && montos[i] !== undefined ? Number(montos[i]) : 0;

      let idCuenta = det.id_cuenta;

      // Si esta línea es de cuenta bancaria y tenemos una cuenta contable vinculada, reemplazar
      if (det.es_cuenta_bancaria && cuentaContableBancaria) {
        idCuenta = cuentaContableBancaria;
      }

      if (!idCuenta) {
        throw new Error(
          `La línea ${det.item} del modelo "${modelo.descripcion}" no tiene cuenta contable asignada`,
        );
      }

      return {
        id_cuenta: idCuenta,
        monto,
        debe_haber: det.debe_haber,
      };
    });

    // 5. Validar partida doble
    const totalDebe = detallesConId
      .filter((d) => d.debe_haber === true)
      .reduce((sum, d) => sum + Number(d.monto), 0);

    const totalHaber = detallesConId
      .filter((d) => d.debe_haber === false)
      .reduce((sum, d) => sum + Number(d.monto), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error(
        `Partida doble no balanceada: Debe=${totalDebe}, Haber=${totalHaber}`,
      );
    }

    // 6. Obtener siguiente número de asiento
    const ultimoAsiento = await db.asientos.findFirst({
      where: { id_proc_contable: periodoActivo.id_proc_contable },
      orderBy: { numero_asiento: 'desc' },
    });
    const nroAsiento = (ultimoAsiento?.numero_asiento || 0) + 1;

    // 7. Crear el asiento
    const asiento = await db.asientos.create({
      data: {
        fecha: fecha || new Date(),
        numero_asiento: nroAsiento,
        descripcion,
        total_debe: totalDebe,
        total_haber: totalHaber,
        estado: 'confirmado',
        tabla_origen,
        id_registro_origen,
        id_proc_contable: periodoActivo.id_proc_contable,
        asiento_detalle: {
          create: detallesConId.map((d) => ({
            id_cuenta: d.id_cuenta,
            monto: d.monto,
            debe_haber: d.debe_haber,
          })),
        },
      },
      include: { asiento_detalle: true },
    });

    return asiento;
  } catch (error) {
    console.error('❌ Error en generarAsientoPorModelo:', error);
    if (strict) throw error;
    return null;
  }
};
