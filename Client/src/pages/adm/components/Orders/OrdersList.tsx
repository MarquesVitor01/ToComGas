import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Order } from '../../../../types';
import { OrderCard } from './OrderCard';

interface OrdersListProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: Order['status']) => void;
}

export const OrdersList = ({ orders, onStatusChange }: OrdersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customer?.name?.toLowerCase() ?? '';
    const customerPhone = order.customer?.phone ?? '';
    const orderId = order.id ?? '';

    const matchesSearch =
      customerName.includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm) ||
      orderId.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedidos</h2>
        <p className="text-gray-600">
          Gerencie todos os pedidos do seu depósito
        </p>
      </div>

      {/* Barra de busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou número do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="preparing">Em Preparação</option>
            <option value="out_for_delivery">Saiu para Entrega</option>
            <option value="delivered">Entregue</option>
          </select>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou termo de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
