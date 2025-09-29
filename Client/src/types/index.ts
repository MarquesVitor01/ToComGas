export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    complement?: string;
  };
}

export interface GasProduct {
  id: string;
  name: string;
  weight: string;
  pickupPrice: number;   // <-- number
  deliveryPrice: number; 
}

export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered';

export interface Order {
  id: string;
  customer: Customer;
  products: {
    product: GasProduct;
    quantity: number;
  }[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  deliveryDate?: Date;
  notes?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
  todayRevenue: number;
}