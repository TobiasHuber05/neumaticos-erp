import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import axios from 'axios';

// Interceptor global para fetch (manejo de expiración de sesión 401)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && !url.includes('/api/auth/perfil') && !url.includes('/api/auth/login')) {
      console.warn('Sesión expirada (401 - fetch). Redirigiendo a inicio de sesión...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('moduloActual');
      window.location.href = '/login';
    }
  }
  return response;
};


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url;
      if (url && !url.includes('/api/auth/perfil') && !url.includes('/api/auth/login')) {
        console.warn('Sesión expirada (401 - axios). Redirigiendo a inicio de sesión...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('moduloActual');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const limpiarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('moduloActual');
};

const tokenVencido = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

function App() {
  const [authState, setAuthState] = useState({ checking: true, authenticated: false });

  useEffect(() => {
    const validarSesion = async () => {
      const token = localStorage.getItem('token');
      if (!token || tokenVencido(token)) {
        limpiarSesion();
        setAuthState({ checking: false, authenticated: false });
        return;
      }

      try {
        const res = await fetch('/api/auth/perfil', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          limpiarSesion();
          setAuthState({ checking: false, authenticated: false });
          return;
        }

        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.usuario));
        setAuthState({ checking: false, authenticated: true });
      } catch {
        limpiarSesion();
        setAuthState({ checking: false, authenticated: false });
      }
    };

    validarSesion();
  }, []);

  if (authState.checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-erp-orange font-black uppercase tracking-widest">
        Validando sesión...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de Login: 
          Si ya está autenticado, lo redirigimos automáticamente al Dashboard (/).
          Si no, mostramos el componente de Login.
        */}
        <Route 
          path="/login" 
          element={!authState.authenticated ? <Login /> : <Navigate to="/" />} 
        />

        {/* Ruta protegida para cambiar contraseña */}
        <Route 
          path="/change-password" 
          element={authState.authenticated ? <ChangePassword /> : <Navigate to="/login" />} 
        />

        {/* Ruta Raíz (Protegida): 
          Si está autenticado, mostramos el Dashboard.
          Si no, lo mandamos al /login.
          El '/*' permite que el Dashboard maneje sus propios sub-módulos internamente.
        */}
        <Route 
          path="/*" 
          element={authState.authenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
