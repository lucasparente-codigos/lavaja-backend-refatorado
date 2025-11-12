import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} LavaJá. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-400">
            Sistema de Gerenciamento de Lavanderias
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
