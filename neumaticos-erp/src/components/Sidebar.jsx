import {
  Banknote,
  BookMarked,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ShoppingCart,
  Tag,
  Landmark,
  Users,
  Package,
  Wrench,
  LogOut,
  Send,
  UserSquare2,
  CoinsIcon,
  PieChart,
  Calendar,
  BarChart2,
  FileText,
  Home,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { puedeVer, puedeAdministrarUsuarios } from '../utils/permisos';

const Sidebar = ({ setModulo, moduloActual }) => {
  const [reportesAbierto, setReportesAbierto] = useState(() => {
    return ['reportes_compras', 'reportes_stock', 'reportes_ventas'].includes(moduloActual);
  });
  const [comprasAbierto, setComprasAbierto] = useState(() => {
    return ['proveedores', 'compras', 'cotizaciones', 'ordenes_compra', 'pagos_proveedores', 'asientos_compras'].includes(moduloActual);
  });
  const [tesoreriaAbierto, setTesoreriaAbierto] = useState(() => {
    return ['gestion_cuentas', 'movimientos bancarios', 'conciliacion bancaria'].includes(moduloActual);
  });
  const [ventasAbierto, setVentasAbierto] = useState(() => {
    return ['facturas de venta', 'presupuesto', 'clientes_ventas', 'notas credito', 'asiento ventas', 'timbrados'].includes(moduloActual);
  });
  const [contabilidadAbierto, setContabilidadAbierto] = useState(() => {
    return ['contabilidad_plan', 'contabilidad_asientos', 'contabilidad_periodos', 'contabilidad_reportes'].includes(moduloActual);
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rol = (user.rol || '').toUpperCase();

  // --- FUNCIÓN DE CIERRE DE SESIÓN ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('moduloActual');
    window.location.href = '/login';
  };

  const moduloComprasItems = [
    { id: 'proveedores', icon: <Users size={18} />, label: 'Proveedores' },
    { id: 'compras', icon: <ShoppingCart size={18} />, label: 'Pedidos de compra' },
    { id: 'cotizaciones', icon: <Send size={18} />, label: 'Cotizaciones' },
    { id: 'ordenes_compra', icon: <ClipboardList size={18} />, label: 'Órdenes de compra' },
    { id: 'pagos_proveedores', icon: <Banknote size={18} />, label: 'Pagos a proveedores' },
    { id: 'asientos_compras', icon: <BookMarked size={18} />, label: 'Asientos compras' },
  ];

  const moduloTesoreriaItems = [
    { id: 'gestion_cuentas', icon: <Users size={18} />, label: 'Gestión de Cuentas' },
    { id: 'movimientos bancarios', icon: <Banknote size={18} />, label: 'Movimientos bancarios' },
    { id: 'conciliacion bancaria', icon: <ClipboardList size={18} />, label: 'Conciliaciones' },
  ];

  const moduloVentasItems = [
    { id: 'presupuesto', icon: <CoinsIcon size={18} />, label: 'Presupuestos' },
    { id: 'facturas de venta', icon: <ClipboardList size={18} />, label: 'Facturas de Venta' },
    { id: 'notas credito', icon: <ClipboardList size={18} />, label: 'Notas de crédito' },
    { id: 'clientes_ventas', icon: <Users size={18} />, label: 'Clientes' },
    { id: 'asiento ventas', icon: <Banknote size={18} />, label: 'Asientos ventas' },
    { id: 'timbrados', icon: <BarChart2 size={18} />, label: 'Timbrados' },
  ];

  const moduloPersonalItems = [
    { id: 'personal', icon: <Users size={18} />, label: 'Funcionarios' },
    { id: 'personal_nomina', icon: <ClipboardList size={18} />, label: 'Nómina y Pagos' },
    { id: 'personal_asientos', icon: <BookMarked size={18} />, label: 'Asientos Nómina' },
  ];

  const moduloContabilidadItems = [
    { id: 'contabilidad_plan', icon: <ClipboardList size={18} />, label: 'Plan de Cuentas' },
    { id: 'contabilidad_asientos', icon: <BookMarked size={18} />, label: 'Asientos Contables' },
    { id: 'contabilidad_periodos', icon: <Calendar size={18} />, label: 'Periodos Contables' },
    { id: 'contabilidad_reportes', icon: <PieChart size={18} />, label: 'Informes y Balances' },
  ];

  return (
    <div className="w-64 h-screen bg-erp-yellow flex flex-col border-r border-orange-300 shrink-0 overflow-x-hidden">
      {/* Logo */}
      <div className="p-6 flex flex-col items-center border-b border-orange-300">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
          <Package className="text-erp-orange" size={32} />
        </div>
        <h2 className="font-bold text-erp-orange text-lg text-center leading-tight">
          Neumáticos ERP
        </h2>
        {rol && (
          <span className="bg-erp-orange text-white text-[10px] px-2 py-0.5 rounded-full mt-1 font-black uppercase tracking-widest text-center max-w-[90%] truncate">
            {rol.includes('|') ? rol.split('|')[0] : rol}
          </span>
        )}
      </div>

      {/* Menú */}
      <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden">
        {/* Inicio */}
        <div className="px-2 mb-2">
          <button
            type="button"
            onClick={() => setModulo('inicio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
              ${moduloActual === 'inicio'
                ? 'bg-erp-orange text-white shadow-inner'
                : 'text-orange-900 hover:bg-orange-200'}`}
          >
            <Home size={20} />
            <span>Inicio</span>
          </button>
        </div>

        {/* Modulo Compras */}
        {puedeVer('compras') && (
          <div className="px-2">
            <button
              type="button"
              onClick={() => setComprasAbierto((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
            >
              <span className="inline-flex items-center gap-3">
                <ShoppingCart size={20} />
                Compras
              </span>
              {comprasAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {comprasAbierto && (
              <div className="mt-1 mb-2">
                {moduloComprasItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModulo(item.id)}
                    className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === item.id
                        ? 'bg-erp-orange text-white shadow-inner'
                        : 'text-orange-800 hover:bg-orange-200'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu Ventas */}
        {puedeVer('ventas') && (
          <div className="px-2">
            <button
              type="button"
              onClick={() => setVentasAbierto((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
            >
              <span className="inline-flex items-center gap-3">
                <Tag size={20} />
                Ventas
              </span>
              {ventasAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {ventasAbierto && (
              <div className="mt-1 mb-2">
                {moduloVentasItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModulo(item.id)}
                    className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === item.id
                        ? 'bg-erp-orange text-white shadow-inner'
                        : 'text-orange-800 hover:bg-orange-200'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/*Menu Tesoreria*/}
        {puedeVer('tesoreria') && (
          <div className="px-2">
            <button
              type="button"
              onClick={() => setTesoreriaAbierto((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
            >
              <span className="inline-flex items-center gap-3">
                <Banknote size={20} />
                Tesorería
              </span>
              {tesoreriaAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {tesoreriaAbierto && (
              <div className="mt-1 mb-2">
                {moduloTesoreriaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModulo(item.id)}
                    className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === item.id
                        ? 'bg-erp-orange text-white shadow-inner'
                        : 'text-orange-800 hover:bg-orange-200'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modulo Contabilidad */}
        {puedeVer('contabilidad') && (
          <div className="px-2">
            <button
              type="button"
              onClick={() => setContabilidadAbierto((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
            >
              <span className="inline-flex items-center gap-3">
                <BookMarked size={20} />
                Contabilidad
              </span>
              {contabilidadAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {contabilidadAbierto && (
              <div className="mt-1 mb-2">
                {moduloContabilidadItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModulo(item.id)}
                    className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === item.id
                        ? 'bg-erp-orange text-white shadow-inner'
                        : 'text-orange-800 hover:bg-orange-200'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Modulo Reportes */}
        {puedeVer('compras') && (
          <div className="px-2">
            <button
              type="button"
              onClick={() => setReportesAbierto((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm">
              <span className="inline-flex items-center gap-3">
                <BarChart2 size={20} />
                Reportes
              </span>
              {reportesAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {reportesAbierto && (
              <div className="mt-1 mb-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setModulo('reportes_compras')}
                  className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === 'reportes_compras'
                      ? 'bg-erp-orange text-white shadow-inner'
                      : 'text-orange-800 hover:bg-orange-200'}`}
                >
                  <FileText size={18} />
                  <span>Compras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModulo('reportes_stock')}
                  className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === 'reportes_stock'
                      ? 'bg-erp-orange text-white shadow-inner'
                      : 'text-orange-800 hover:bg-orange-200'}`}
                >
                  <Package size={18} />
                  <span>Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModulo('reportes_ventas')}
                  className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition-all font-medium text-sm
                    ${moduloActual === 'reportes_ventas'
                      ? 'bg-erp-orange text-white shadow-inner'
                      : 'text-orange-800 hover:bg-orange-200'}`}
                >
                  <ShoppingBag size={18} />
                  <span>Ventas</span>
                </button>
              </div>
            )}
          </div>
        )}
        {/* Quick Links */}
        <div className="px-2 mt-4 pt-4 border-t border-orange-300">
          {puedeVer('stock') && (
            <button
              type="button"
              onClick={() => setModulo('stock')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
                ${moduloActual === 'stock'
                  ? 'bg-erp-orange text-white shadow-inner'
                  : 'text-orange-900 hover:bg-orange-200'}`}
            >
              <Package size={20} />
              <span>Stock</span>
            </button>
          )}

          {puedeVer('ventas') && (
            <button
              type="button"
              onClick={() => setModulo('servicios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
                ${moduloActual === 'servicios'
                  ? 'bg-erp-orange text-white shadow-inner'
                  : 'text-orange-900 hover:bg-orange-200'}`}
            >
              <Wrench size={20} />
              <span>Servicios</span>
            </button>
          )}

          {puedeVer('personal') && (
            <button
              type="button"
              onClick={() => setModulo('personal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
                ${moduloActual === 'personal' || moduloActual === 'personal_asientos' || moduloActual === 'personal_nomina'
                  ? 'bg-erp-orange text-white shadow-inner'
                  : 'text-orange-900 hover:bg-orange-200'}`}
            >
              <Users size={20} />
              <span>Funcionarios</span>
            </button>
          )}
          {puedeAdministrarUsuarios() && (
            <button
              type="button"
              onClick={() => setModulo('usuarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
                ${moduloActual === 'usuarios'
                  ? 'bg-erp-orange text-white shadow-inner'
                  : 'text-orange-900 hover:bg-orange-200'}`}
            >
              <UserSquare2 size={20} />
              <span>Gestión de Usuarios</span>
            </button>
          )}
        </div>

      </nav>

      {/* Salida */}
      <div className="p-4 border-t border-orange-300 space-y-2">
        <Link
          to="/change-password"
          className="w-full flex items-center gap-4 px-6 py-3 text-orange-900 font-bold bg-blue-100 rounded-lg hover:bg-blue-400 hover:text-white transition-all text-xs uppercase"
        >
          <Lock size={18} />
          Cambiar Contraseña
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-3 text-orange-900 font-bold bg-orange-200 rounded-lg hover:bg-red-400 hover:text-white transition-all text-xs uppercase"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};


export default Sidebar;