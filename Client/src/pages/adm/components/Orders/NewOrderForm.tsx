import React, { useState, useEffect } from "react";
import { Plus, Minus, Save, User, MapPin } from "lucide-react";
import { db } from "../../../../config/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { Customer, GasProduct } from "../../../../types";
import { toast, ToastContainer } from "react-toastify";

interface NewOrderFormProps {
  onSuccess: () => void;
}

export const NewOrderForm = ({ onSuccess }: NewOrderFormProps) => {
  const [gasProducts, setGasProducts] = useState<GasProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "São Paulo",
      complement: "",
    },
  });
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: number;
  }>({});
  const [notes, setNotes] = useState("");
  const [modeloVenda, setModeloVenda] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "produtos"));
        const products: GasProduct[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as GasProduct)
        );
        setGasProducts(products);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    fetchProducts();
  }, []);

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
        .replace(/-$/, "");
    } else {
      return digits
        .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
        .replace(/-$/, "");
    }
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts((prev) => ({ ...prev, [productId]: quantity }));
    }
  };

  const calculateTotal = () => {
    return Object.entries(selectedProducts).reduce(
      (total, [productId, quantity]) => {
        const product = gasProducts.find((p) => p.id === productId);

        if (!product) return total;

        let preco = 0;
        if (modeloVenda === "pickupPrice") {
          preco = product.pickupPrice ?? 0;
        } else if (modeloVenda === "deliveryPrice") {
          preco = product.deliveryPrice ?? 0;
        }

        return total + preco * quantity;
      },
      0
    );
  };

  async function gerarNumeroPedido(min = 100000, max = 999999) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async function gerarNumeroUnico() {
    let numero;
    let existe = true;

    while (existe) {
      numero = await gerarNumeroPedido();

      const q = query(
        collection(db, "pedidos"),
        where("numberOrder", "==", numero)
      );
      const snapshot = await getDocs(q);
      existe = !snapshot.empty;
    }

    return numero;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const products = Object.entries(selectedProducts).map(
      ([productId, quantity]) => ({
        product: gasProducts.find((p) => p.id === productId)!,
        quantity,
      })
    );

    const numberOrder = await gerarNumeroUnico();
    if (typeof numberOrder !== "number") {
      alert("Erro ao gerar número do pedido. Tente novamente.");
      return false;
    }

    const orderData = {
      customer: { ...customer, id: Date.now().toString() },
      deliveryType: modeloVenda === "deliveryPrice" ? "delivery" : "pickup",
      numberOrder,
      products,
      totalAmount: calculateTotal(),
      changeAmount,
      needsChange,
      paymentMethod,
      notes: notes.trim(),
      status: "pending",
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "pedidos"), orderData);
      onSuccess();

      setCustomer({
        name: "",
        phone: "",
        address: {
          street: "",
          number: "",
          neighborhood: "",
          city: "São Paulo",
          complement: "",
        },
      });
      setSelectedProducts({});
      setNotes("");
    } catch (error) {
      console.error("Erro ao salvar pedido: ", error);
    }
  };

  const isFormValid = () => {
    return (
      modeloVenda &&
      customer.name.trim() &&
      customer.phone.trim() &&
      customer.address.street.trim() &&
      customer.address.number.trim() &&
      customer.address.neighborhood.trim() &&
      Object.keys(selectedProducts).length > 0
    );
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);

    if (method !== "dinheiro") {
      setNeedsChange(false);
      setChangeAmount("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-6">Novo Pedido</h3>

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
            onChange={(e) =>
              setCustomer((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            placeholder="(11) 99999-9999 *"
            value={formatPhone(customer.phone)}
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                phone: e.target.value.replace(/\D/g, ""),
              }))
            }
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
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                address: { ...prev.address, street: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Número *"
            value={customer.address.number}
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                address: { ...prev.address, number: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Bairro *"
            value={customer.address.neighborhood}
            onChange={(e) =>
              setCustomer((prev) => ({
                ...prev,
                address: { ...prev.address, neighborhood: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Complemento"
          value={customer.address.complement}
          onChange={(e) =>
            setCustomer((prev) => ({
              ...prev,
              address: { ...prev.address, complement: e.target.value },
            }))
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900">Produtos</h4>
        <div className="space-y-3">
          <select
            value={modeloVenda}
            onChange={(e) => setModeloVenda(e.target.value)}
            className="border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Modelo de Venda</option>
            <option value="pickupPrice">Retirada</option>
            <option value="deliveryPrice">Entrega</option>
          </select>
          {gasProducts.map((product) => {
            const preco =
              modeloVenda === "pickupPrice"
                ? product.pickupPrice
                : modeloVenda === "deliveryPrice"
                ? product.deliveryPrice
                : null;

            const stock = product.quantity ?? 0; 
            const selected = selectedProducts[product.id] || 0; 
            const isOutOfStock = stock === 0;
            const isMaxReached = selected >= stock; 

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div>
                  <h5 className="font-medium text-gray-900">{product.name}</h5>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium text-gray-700">
                      {product.weight}Kg
                    </span>
                    <span className="text-gray-400">•</span>
                    {preco !== null && (
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(preco)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Botão de diminuir */}
                  <button
                    type="button"
                    onClick={() =>
                      handleProductQuantityChange(product.id, selected - 1)
                    }
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    disabled={selected <= 0}
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>

                  <span className="w-8 text-center font-medium">
                    {selected}
                  </span>

                  {/* Botão de aumentar */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isMaxReached) {
                        toast.error("Quantidade máxima em estoque atingida!");
                        return;
                      }
                      handleProductQuantityChange(product.id, selected + 1);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    disabled={isOutOfStock || isMaxReached}
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Observações..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {["dinheiro", "pix", "cartão de débito", "cartão de crédito"].map(
            (method) => (
              <label
                key={method}
                className="flex items-center gap-4 p-5 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  className="w-5 h-5 text-blue-600 scale-125"
                />
                <span className="font-semibold capitalize text-gray-800">
                  {method === "dinheiro" && "💵"}
                  {method === "pix" && "📱"}
                  {method === "cartão de débito" && "💳"}
                  {method === "cartão de crédito" && "💳"}
                  {method}
                </span>
              </label>
            )
          )}
        </div>
      </div>
      {paymentMethod === "dinheiro" && (
        <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={needsChange}
              onChange={(e) => setNeedsChange(e.target.checked)}
              className="w-5 h-5 text-orange-600 scale-125"
            />
            <span className="font-semibold text-gray-800">
              💰 Precisa de troco?
            </span>
          </label>

          {needsChange && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Troco para quanto?
              </label>
              <input
                type="number"
                value={changeAmount}
                onChange={(e) => setChangeAmount(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                placeholder="R$ 0,00"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xl font-bold text-gray-900">
          Total:{" "}
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(calculateTotal())}
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
      <ToastContainer />
    </form>
  );
};
