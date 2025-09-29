import { Clock, User, Phone, MapPin, Package, Truck, CheckCircle } from 'lucide-react';
import { Order } from '../../../../types';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: Order['status']) => void;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Clock
  },
  preparing: {
    label: 'Em Preparação',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package
  },
  out_for_delivery: {
    label: 'Saiu para Entrega',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  }
};

const nextStatus = {
  pending: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null
} as const;

export const OrderCard = ({ order, onStatusChange }: OrderCardProps) => {
  // Fallback seguro para status
  const status = statusConfig[order.status as keyof typeof statusConfig] ?? {
    label: 'Status desconhecido',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Package
  };

  const next = nextStatus[order.status];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pedido #{order.id}</h3>
            {order.createdAt && (
              <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Dados do Cliente */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-medium">
            {order.customer?.name ?? 'Cliente não informado'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{order.customer?.phone ?? 'Telefone não informado'}</span>
        </div>

        {order.customer?.address && (
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                {order.customer.address.street}, {order.customer.address.number}
              </p>
              <p>
                {order.customer.address.neighborhood} -{' '}
                {order.customer.address.city}
              </p>
              {order.customer.address.complement && (
                <p className="text-gray-500">{order.customer.address.complement}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Produtos */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <h4 className="font-medium text-gray-900 text-sm">Produtos:</h4>
        {order.products && order.products.length > 0 ? (
          order.products.map((item, index) => {
            const hasProduct = item && item.product;
            return (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600">
                  {item.quantity}x{' '}
                  {hasProduct ? (
                    <>
                      {item.product.name} ({item.product.weight})
                    </>
                  ) : (
                    <span className="italic text-gray-400">
                      Produto não encontrado
                    </span>
                  )}
                </span>
                <span className="font-medium text-gray-900">
                  {hasProduct
                    ? formatCurrency(item.product.pickupPrice * item.quantity)
                    : '-'}
                </span>
                <span className="font-medium text-gray-900">
                  {hasProduct
                    ? formatCurrency(item.product.deliveryPrice * item.quantity)
                    : '-'}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhum produto adicionado</p>
        )}

        {/* Observações */}
        {order.notes && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Obs:</strong> {order.notes}
          </div>
        )}

        {/* Total + Avançar Status */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">
            Total: {formatCurrency(order.totalAmount ?? 0)}
          </span>

          {next && (
            <button
              onClick={() => onStatusChange(order.id, next)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              Avançar Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
