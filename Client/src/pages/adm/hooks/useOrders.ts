import { useEffect, useState } from "react";
import { db } from "../../../config/firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { Order, OrderStats } from "../../../types";

// Catálogo fixo de produtos

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pedidosRef = collection(db, "pedidos");

    const unsubscribe = onSnapshot(pedidosRef, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;

        return {
          id: docSnap.id,
          numberOrder: data.numberOrder,
          paymentMethod: data.paymentMethod,
          needsChange: data.needsChange,
          changeAmount: data.changeAmount,
          deliveryType: data.deliveryType,
          status: data.status as Order["status"],
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
          customer: data.customer,
          products: data.products,
          notes: data.notes ?? "",
          totalAmount: data.totalAmount,
          deliveryDate: data.deliveryDate
            ? new Date(data.deliveryDate.seconds * 1000)
            : undefined,
        };
      });

      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Adicionar pedido na collection "pedidos"
  const addOrder = async (
    orderData: Omit<Order, "id" | "createdAt" | "status">
  ) => {
    const newOrder = {
      ...orderData,
      createdAt: new Date(),
      status: "pending" as Order["status"],
    };

    await addDoc(collection(db, "pedidos"), newOrder);
  };

  // Atualizar status de um pedido na collection "pedidos"
  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"]
  ) => {
    const orderRef = doc(db, "pedidos", orderId);
    await updateDoc(orderRef, {
      status,
      deliveryDate: status === "delivered" ? new Date() : null,
    });
  };

  // Estatísticas para Dashboard
  const getOrderStats = (): OrderStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      outForDelivery: orders.filter((o) => o.status === "out_for_delivery")
        .length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      todayRevenue: todayOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      ),
    };
  };

  return {
    orders,
    loading,
    addOrder,
    updateOrderStatus,
    getOrderStats,
  };
};
