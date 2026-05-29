import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const limpiarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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
