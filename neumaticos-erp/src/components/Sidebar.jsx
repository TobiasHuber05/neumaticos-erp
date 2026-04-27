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
  FileText,
  Home,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ setModulo, moduloActual }) => {
  const [comprasAbierto, setComprasAbierto] = useState(true);
  const [tesoreriaAbierto, setTesoreriaAbierto] = useState(false);
  const [ventasAbierto, setVentasAbierto] = useState(false);
  const [contabilidadAbierto, setContabilidadAbierto] = useState(false);

  // --- FUNCIÓN DE CIERRE DE SESIÓN ---
  const handleLogout = () => {
    // 1. Borramos el token y los datos del usuario del almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Redirigimos a la pantalla de login (esto disparará la lógica de App.jsx)
    window.location.href = '/login';
  };
  // ------------------------------------

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
    { id: 'facturas de venta', icon: <ClipboardList size={18} />, label: 'Facturas de Venta' },
    { id: 'presupuesto', icon: <CoinsIcon size={18} />, label: 'Presupuestos' },
    { id: 'clientes_ventas', icon: <Users size={18} />, label: 'Clientes' },
    { id: 'notas credito', icon: <ClipboardList size={18} />, label: 'Notas de crédito' },
    { id: 'asiento ventas', icon: <Banknote size={18} />, label: 'Asientos ventas' },
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

  const menuItems = [
    { id: 'stock', icon: <Package size={20} />, label: 'Stock / Existencias' },
    { id: 'servicios', icon: <Wrench size={20} />, label: 'Servicios' },
    { id: 'personal', icon: <Users size={20} />, label: 'Funcionarios' },
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
        <div className="px-2">
          <button
            type="button"
            onClick={() => setComprasAbierto((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
          >
            <span className="inline-flex items-center gap-3">
              <ShoppingCart size={20} />
              Modulo Compras
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

        {/* Menu Ventas */}
        <div className="px-2">
          <button
            type="button"
            onClick={() => setVentasAbierto((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
          >
            <span className="inline-flex items-center gap-3">
              <Tag size={20} />
              Ventas y Facturas
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

        {/*Menu Tesoreria*/}
        <div className="px-2">
          <button
            type="button"
            onClick={() => setTesoreriaAbierto((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-orange-900 hover:bg-orange-200 rounded-lg transition-all font-bold text-sm"
          >
            <span className="inline-flex items-center gap-3">
              <Banknote size={20} />
              Modulo Tesorería
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

        {/* Modulo Contabilidad */}
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

        {/* Quick Links */}
        <div className="px-2 mt-4 pt-4 border-t border-orange-300">
          {menuItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setModulo(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm
                  ${moduloActual === item.id || (item.id === 'personal' && (moduloActual === 'personal' || moduloActual === 'personal_asientos' || moduloActual === 'personal_nomina'))
                  ? 'bg-erp-orange text-white shadow-inner'
                  : 'text-orange-900 hover:bg-orange-200'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

      </nav>

      {/* Salida */}
      <div className="p-4 border-t border-orange-300">
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