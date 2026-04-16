import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <form onSubmit={handleLogin} style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px' }}>
        <h2 style={{ color: '#f39c12', textAlign: 'center' }}>Neumáticos ERP</h2>
        {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default Login;