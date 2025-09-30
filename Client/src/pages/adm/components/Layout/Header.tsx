import { Flame } from 'lucide-react';
import { useLogoutUser } from '../../hooks/logout';

export const Header = () => {
  const logoutUser = useLogoutUser();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">To Com Gás</h1>
              <p className="text-xs text-gray-500">Sistema de Pedidos</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              <span className="font-medium">Hoje:</span> {new Date().toLocaleDateString('pt-BR')}
            </div>
            <button onClick={logoutUser} className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
          Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};