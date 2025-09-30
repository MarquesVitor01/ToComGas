import { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { OrdersList } from './components/Orders/OrdersList';
import { NewOrderForm } from './components/Orders/NewOrderForm';
import { useOrders } from './hooks/useOrders';
import ProductsList from './components/Products/ProductsList';
import { useAuth } from '../../config/context/AuthContext';

type ViewType = 'dashboard' | 'orders' | 'new-order' | 'products';

function AdmScreen() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { orders, updateOrderStatus } = useOrders();
  const { cargo } = useAuth();

  useEffect(() => {
    if (cargo === 'entregador') {
      setCurrentView('orders');
    }
  }, [cargo]);

  const handleNewOrderSuccess = () => {
    setCurrentView('orders');
  };

  const renderContent = () => {
    if (cargo === 'entregador') {
      return <OrdersList orders={orders} onStatusChange={updateOrderStatus} />;
    }

    // admin ou outros cargos
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrdersList orders={orders} onStatusChange={updateOrderStatus} />;
      case 'new-order':
        return <NewOrderForm onSuccess={handleNewOrderSuccess} />;
      case 'products':
        return <ProductsList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        {/* 🔒 Entregador não vê o Sidebar */}
        {cargo !== 'entregador' && (
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        )}

        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdmScreen;
