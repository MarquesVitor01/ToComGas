import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, User, MapPin } from 'lucide-react';
import { db } from '../../../../config/firebase/firebaseConfig';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Customer, GasProduct } from '../../../../types';

interface NewOrderFormProps {
  onSuccess: () => void;
}

export const NewOrderForm = ({ onSuccess }: NewOrderFormProps) => {
  const [gasProducts, setGasProducts] = useState<GasProduct[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    address: { street: '', number: '', neighborhood: '', city: 'São Paulo', complement: '' }
  });
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});
  const [notes, setNotes] = useState('');

  // 🔹 Buscar produtos do Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'produtos'));
        const products: GasProduct[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GasProduct));
        setGasProducts(products);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };
    fetchProducts();
  }, []);

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
    }
  };

  const calculateTotal = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = gasProducts.find(p => p.id === productId);
      return total + (product ? product.pickupPrice * quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const products = Object.entries(selectedProducts).map(([productId, quantity]) => ({
      product: gasProducts.find(p => p.id === productId)!,
      quantity
    }));

    const orderData = {
      customer: { ...customer, id: Date.now().toString() },
      products,
      totalAmount: calculateTotal(),
      notes: notes.trim() || undefined,
      status: 'pending',
      createdAt: Timestamp.now()
    };

    try {
      await addDoc(collection(db, 'pedidos'), orderData);
      onSuccess();

      setCustomer({
        id: '',
        name: '',
        phone: '',
        address: { street: '', number: '', neighborhood: '', city: 'São Paulo', complement: '' }
      });
      setSelectedProducts({});
      setNotes('');
    } catch (error) {
      console.error('Erro ao salvar pedido: ', error);
    }
  };

  const isFormValid = () => {
    return (
      customer.name.trim() &&
      customer.phone.trim() &&
      customer.address.street.trim() &&
      customer.address.number.trim() &&
      customer.address.neighborhood.trim() &&
      Object.keys(selectedProducts).length > 0
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Novo Pedido</h3>

      {/* Cliente */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Informações do Cliente
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome completo *"
            value={customer.name}
            onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            placeholder="(11) 99999-9999 *"
            value={formatPhone(customer.phone)}
            onChange={e => setCustomer(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Endereço de Entrega
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Rua/Avenida *"
            value={customer.address.street}
            onChange={e =>
              setCustomer(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Número *"
            value={customer.address.number}
            onChange={e =>
              setCustomer(prev => ({ ...prev, address: { ...prev.address, number: e.target.value } }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Bairro *"
            value={customer.address.neighborhood}
            onChange={e =>
              setCustomer(prev => ({ ...prev, address: { ...prev.address, neighborhood: e.target.value } }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Complemento"
          value={customer.address.complement}
          onChange={e =>
            setCustomer(prev => ({ ...prev, address: { ...prev.address, complement: e.target.value } }))
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Produtos */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Produtos</h4>
        <div className="space-y-3">
          {gasProducts.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h5 className="font-medium text-gray-900">{product.name}</h5>
                <p className="text-sm text-gray-600">
                  {product.weight} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.deliveryPrice)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    handleProductQuantityChange(
                      product.id,
                      (selectedProducts[product.id] || 0) - 1
                    )
                  }
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  disabled={!selectedProducts[product.id]}
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-medium">{selectedProducts[product.id] || 0}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleProductQuantityChange(
                      product.id,
                      (selectedProducts[product.id] || 0) + 1
                    )
                  }
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="mb-6">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Observações..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total e botão */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xl font-bold text-gray-900">
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
        </div>
        <button
          type="submit"
          disabled={!isFormValid()}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
        >
          <Save className="w-5 h-5" />
          <span>Criar Pedido</span>
        </button>
      </div>
    </form>
  );
};
