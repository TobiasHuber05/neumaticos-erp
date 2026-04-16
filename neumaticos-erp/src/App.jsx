import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  // Función para verificar si existe un token en el almacenamiento local
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  return (
    <Router>
      <Routes>
        {/* Ruta de Login: 
          Si ya está autenticado, lo redirigimos automáticamente al Dashboard (/).
          Si no, mostramos el componente de Login.
        */}
        <Route 
          path="/login" 
          element={!isAuthenticated() ? <Login /> : <Navigate to="/" />} 
        />

        {/* Ruta Raíz (Protegida): 
          Si está autenticado, mostramos el Dashboard.
          Si no, lo mandamos al /login.
          El '/*' permite que el Dashboard maneje sus propios sub-módulos internamente.
        */}
        <Route 
          path="/*" 
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;