export const MODULOS_SISTEMA = ['compras', 'ventas', 'tesoreria', 'contabilidad', 'stock', 'personal'];

/**
 * Cargos que pueden ver precios de compra por defecto (sin permiso extra).
 */
const tienePreciosCompraBaseCargo = (cargoNombre) => {
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

export const puedeVerPreciosCompra = (usuario) => {
  const rol = usuario?.rol_empresa || usuario?.rol || '';
  if (esAdminOGerente(rol)) return true;
  if (tienePreciosCompraBaseCargo(rol)) return true;
  return Boolean(usuario?.permisos?.verPreciosCompra);
};

export const normalizarCargo = (nombre) =>
  (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const mod = (ver, editar) => ({ ver, editar });

const todosLosModulos = (editar = true) =>
  Object.fromEntries(MODULOS_SISTEMA.map((id) => [id, mod(true, editar)]));

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

export const puedeAccederModulo = (usuario, moduloId, accion = 'ver') => {
  const rol = usuario?.rol_empresa || usuario?.rol || '';
  if (esAdminOGerente(rol)) return true;

  const requiereEditar = accion === 'editar';
  const base = getPermisosBaseCargo(rol)[moduloId];
  if (base?.editar || (!requiereEditar && base?.ver)) return true;

  const extra = usuario?.permisos?.[moduloId];
  if (extra?.editar || (!requiereEditar && extra?.ver)) return true;

  return false;
};