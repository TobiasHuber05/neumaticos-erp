import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn } from 'lucide-react';
import backgroundImage from '../assets/taller_pro.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Usamos /api gracias al proxy que configuramos en vite.config.js
      const response = await axios.post('/api/auth/login', { email, password });

      // Guardamos el token y datos del usuario
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));

      // Recargar para entrar al dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Capa de superposición oscura con desenfoque */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-8 border-erp-orange transform transition-all hover:scale-[1.01]">
          <div className="p-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-erp-orange uppercase tracking-tighter mb-2">
                Neumáticos ERP
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                Gestión Integral Automotriz
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-shake">
                  <p className="text-red-700 text-xs font-bold uppercase">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-erp-orange text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@ejemplo.com"
                    className="block w-full pl-10 pr-3 py-3 bg-orange-50/30 border border-orange-100 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-erp-orange focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-erp-orange text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 bg-orange-50/30 border border-orange-100 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-erp-orange focus:border-transparent transition-all sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-erp-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-erp-orange transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Ingresar
                    <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              &copy; 2026 Neumáticos ERP — Sistema de Gestión Automotriz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
