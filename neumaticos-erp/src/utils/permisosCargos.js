/**
 * Módulos fijos por cargo (no se modifican al editar permisos extra del usuario).
 * Los permisos en BD solo agregan acceso a otros módulos.
 */

export const MODULOS_SISTEMA = [
  { id: 'compras', label: 'Módulo Compras' },
  { id: 'ventas', label: 'Ventas y Facturación' },
  { id: 'tesoreria', label: 'Tesorería' },
  { id: 'contabilidad', label: 'Contabilidad' },
  { id: 'stock', label: 'Stock / Existencias' },
  { id: 'personal', label: 'Funcionarios / Personal' },
];

/**
 * Permisos especiales (no son módulos, son capacidades dentro de módulos).
 * Se almacenan en usuario.permisos bajo una clave especial.
 */
export const PERMISOS_ESPECIALES = [
  { id: 'verPreciosCompra', label: 'Ver precios de compra de productos' },
];

/**
 * Cargos que tienen acceso a precios de compra por defecto.
 * Admin, Gerente General, Contador, y roles de Compras lo ven siempre.
 */
export const tienePreciosCompraBaseCargo = (cargoNombre) => {
  const c = normalizarCargo(cargoNombre);
  if (!c) return false;
  if (c === 'ADMIN' || (c.includes('GERENTE') && c.includes('GENERAL'))) return true;
  if (c.includes('CONTADOR')) return true;
  if (
    c.includes('COMPRAS') ||
    (c.includes('JEFE') && c.includes('COMPRA')) ||
    c === 'ENCARGADO' ||
    (c.includes('ENCARGADO') && c.includes('COMPRA'))
  ) return true;
  return false;
};

const IDS_MODULOS = MODULOS_SISTEMA.map((m) => m.id);

export const normalizarCargo = (nombre) =>
  (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const mod = (ver, editar) => ({ ver, editar });

const todosLosModulos = (editar = true) =>
  Object.fromEntries(IDS_MODULOS.map((id) => [id, mod(true, editar)]));

/** Permisos que vienen solo del cargo (fijos). */
export const getPermisosBaseCargo = (cargoNombre) => {
  const c = normalizarCargo(cargoNombre);
  if (!c) return {};

  if (c === 'ADMIN' || (c.includes('GERENTE') && c.includes('GENERAL'))) {
    return todosLosModulos(true);
  }

  if (c.includes('CONTADOR')) {
    const base = todosLosModulos(false);
    base.contabilidad = mod(true, true);
    return base;
  }

  if (c.includes('TESORER') || c.includes('CAJERO')) {
    return { tesoreria: mod(true, true) };
  }

  if (c.includes('RRHH') || c.includes('RECURSOS HUMANOS')) {
    return { personal: mod(true, true) };
  }

  if (c.includes('DEPOSITO') || (c.includes('ENCARGADO') && c.includes('DEP'))) {
    return { stock: mod(true, true) };
  }

  if (c.includes('VENTAS') || c.includes('VENDEDOR')) {
    return { ventas: mod(true, true), stock: mod(true, true) };
  }

  if (
    c.includes('COMPRAS') ||
    (c.includes('JEFE') && c.includes('COMPRA')) ||
    c === 'ENCARGADO' ||
    (c.includes('ENCARGADO') && c.includes('COMPRA'))
  ) {
    return { compras: mod(true, true), stock: mod(true, true) };
  }

  return {};
};

export const esAdminOGerente = (cargoNombre) => {
  const c = normalizarCargo(cargoNombre);
  return c === 'ADMIN' || (c.includes('GERENTE') && c.includes('GENERAL'));
};

/** Módulos que el admin puede sumar al usuario (no incluidos en su cargo). */
export const getModulosAdicionalesDisponibles = (cargoNombre) => {
  const base = getPermisosBaseCargo(cargoNombre);
  return MODULOS_SISTEMA.filter((m) => !base[m.id]);
};

export const esModuloDelCargo = (cargoNombre, moduloId) =>
  Boolean(getPermisosBaseCargo(cargoNombre)[moduloId]);

/** Solo guarda permisos de módulos que no son del cargo, y permisos especiales booleanos. */
export const filtrarPermisosExtra = (permisos, cargoNombre) => {
  const base = getPermisosBaseCargo(cargoNombre);
  const idsEspeciales = new Set(PERMISOS_ESPECIALES.map((p) => p.id));
  const extra = {};
  for (const [moduloId, regla] of Object.entries(permisos || {})) {
    // Permisos especiales (booleanos): preservar si están activos
    if (idsEspeciales.has(moduloId)) {
      if (regla) extra[moduloId] = true;
      continue;
    }
    // Módulos: omitir los que ya vienen del cargo
    if (base[moduloId]) continue;
    if (regla?.ver || regla?.editar) {
      extra[moduloId] = {
        ver: Boolean(regla.ver),
        editar: Boolean(regla.editar),
      };
    }
  }
  return extra;
};

/** Texto para mostrar en el formulario de usuario. */
export const describirModulosCargo = (cargoNombre) => {
  const base = getPermisosBaseCargo(cargoNombre);
  const partes = MODULOS_SISTEMA.filter((m) => base[m.id]).map((m) => {
    const p = base[m.id];
    const modo = p.editar ? 'editar' : 'solo ver';
    return `${m.label} (${modo})`;
  });
  return partes.length ? partes.join(' · ') : 'Sin módulos asignados para este cargo';
};
