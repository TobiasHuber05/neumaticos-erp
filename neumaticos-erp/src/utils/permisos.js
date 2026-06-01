// utils/permisos.js — cargo fijo + permisos extra opcionales por usuario

import {
  esAdminOGerente,
  getPermisosBaseCargo,
  normalizarCargo,
  tienePreciosCompraBaseCargo,
} from './permisosCargos.js';

export { MODULOS_SISTEMA, PERMISOS_ESPECIALES, getPermisosBaseCargo, getModulosAdicionalesDisponibles, describirModulosCargo, filtrarPermisosExtra, esModuloDelCargo } from './permisosCargos.js';

export const getUserPermisos = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    rol: user.rol || '',
    permisos: user.permisos || {},
  };
};

/** Gestión de usuarios: solo Admin o Gerente General */
export const puedeAdministrarUsuarios = () => {
  const { rol } = getUserPermisos();
  return esAdminOGerente(rol) || normalizarCargo(rol) === 'ADMIN';
};

/** ¿Puede ver el módulo? (cargo fijo + extras agregados al editar usuario) */
export const puedeVer = (moduloId) => {
  const { rol, permisos } = getUserPermisos();
  if (esAdminOGerente(rol) || normalizarCargo(rol) === 'ADMIN') return true;

  const base = getPermisosBaseCargo(rol)[moduloId];
  if (base?.ver || base?.editar) return true;

  const extra = permisos[moduloId];
  if (extra?.ver || extra?.editar) return true;

  return false;
};

/** ¿Puede ver los precios de compra de los productos? */
export const puedeVerPreciosCompra = () => {
  const { rol, permisos } = getUserPermisos();
  if (esAdminOGerente(rol) || normalizarCargo(rol) === 'ADMIN') return true;
  if (tienePreciosCompraBaseCargo(rol)) return true;
  return Boolean(permisos?.verPreciosCompra);
};

/** ¿Puede crear / modificar / eliminar? (cargo fijo + extra con editar) */
export const puedeEditar = (moduloId) => {
  const { rol, permisos } = getUserPermisos();
  if (esAdminOGerente(rol) || normalizarCargo(rol) === 'ADMIN') return true;

  const base = getPermisosBaseCargo(rol)[moduloId];
  if (base?.editar) return true;

  const extra = permisos[moduloId];
  if (extra?.editar) return true;
  if (extra?.ver && !extra?.editar) return false;

  return false;
};