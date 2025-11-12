import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <img 
              className="h-10 w-10 rounded-lg object-cover shadow-sm" 
              src="/logo.jpeg" 
              alt="LavaJá Logo" 
            />
            <span className="text-xl font-bold text-gray-900">LavaJá</span>
          </div>

          {/* Navegação e Perfil */}
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-1">
              <a 
                href="/home" 
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </a>
              {user?.type === 'company' && (
                <a 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </a>
              )}
            </nav>

            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.type === 'user' ? 'Cliente' : 'Empresa'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;