import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { buildApiUrl } from './config/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Contas from './pages/Contas';
import Importacao from './pages/Importacao';
import Transacoes from './pages/Transacoes';
import Relatorios from './pages/Relatorios';
import Documentacao from './pages/Documentacao';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar se token é válido
      fetch(buildApiUrl('/api/auth/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={() => setIsAuthenticated(false)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/empresas"
          element={
            isAuthenticated ? (
              <Empresas />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/contas"
          element={
            isAuthenticated ? (
              <Contas />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/importacao"
          element={
            isAuthenticated ? (
              <Importacao />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/transacoes"
          element={
            isAuthenticated ? (
              <Transacoes />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/relatorios"
          element={
            isAuthenticated ? (
              <Relatorios />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/documentacao"
          element={
            isAuthenticated ? (
              <Documentacao />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
