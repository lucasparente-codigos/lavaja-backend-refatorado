import React from 'react';
import { useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterUser from './pages/RegisterUser';
import RegisterCompany from './pages/RegisterCompany';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  const { user, isAuthenticated } = useAuth();

  // Rotas para usuários não autenticados
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/user" element={<RegisterUser />} />
          <Route path="/register/company" element={<RegisterCompany />} />
          {/* Redireciona qualquer outra rota para o login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Rotas para usuários autenticados
  const homePath = user?.type === 'company' ? '/dashboard' : '/home';

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to={homePath} replace />} />
            <Route path="/home" element={<HomePage />} />
            
            {/* Rota de Dashboard apenas para empresas */}
            <Route 
              path="/dashboard" 
              element={user?.type === 'company' ? <DashboardPage /> : <Navigate to="/home" replace />} 
            />

            {/* Redireciona rotas de login/registro para a home apropriada se já estiver autenticado */}
            <Route path="/login" element={<Navigate to={homePath} replace />} />
            <Route path="/register" element={<Navigate to={homePath} replace />} />
            
            {/* Fallback para a home apropriada */}
            <Route path="*" element={<Navigate to={homePath} replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}