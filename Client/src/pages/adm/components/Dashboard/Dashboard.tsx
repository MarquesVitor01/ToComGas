import { Package, Clock, Truck, CheckCircle, DollarSign } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { StatsCard } from './StatsCard';

export const Dashboard = () => {
  const { getOrderStats } = useOrders();
  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Acompanhe o desempenho dos seus pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total de Pedidos"
          value={stats.total}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Em Preparação"
          value={stats.preparing}
          icon={Package}
          color="gray"
        />
        <StatsCard
          title="Saiu p/ Entrega"
          value={stats.outForDelivery}
          icon={Truck}
          color="blue"
        />
        <StatsCard
          title="Entregues"
          value={stats.delivered}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Faturamento Hoje"
          value={stats.todayRevenue}
          icon={DollarSign}
          color="green"
          format="currency"
        />
      </div>
    </div>
  );
};