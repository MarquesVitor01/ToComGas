import React, { useState, useEffect } from "react";
import {
  MapPin,
  Home,
  CreditCard,
  Copy,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { db } from "../../../config/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import { GasProduct } from "../../../types";
import { useOrders } from "../../adm/hooks/useOrders";

interface CustomerData {
  name: string;
  phone: string;
  address: string;
  number: string;
  neighborhood: string;
  cep: string;
  reference: string;
}

interface OrderProduct {
  product: {
    id: string;
    name: string;
    pickupPrice: number;
    deliveryPrice: number;
    weight: string;
  };
  quantity: number;
}

interface OrderData {
  numberOrder: number;
  customer: CustomerData;
  products: OrderProduct[];
  deliveryType: "delivery" | "pickup";
  paymentMethod: string;
  needsChange: boolean;
  changeAmount: string;
  status?: "pending" | "preparing" | "out_for_delivery" | "delivered";
}

const UserScreen: React.FC = () => {
  // Estados principais
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    phone: "",
    address: "",
    number: "",
    neighborhood: "",
    cep: "",
    reference: "",
  });

  const [gasProducts, setGasProducts] = useState<GasProduct[]>([]);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const {orders} = useOrders()
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: number;
  }>({});
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


  const handleCustomerDataChange = (field: keyof CustomerData, value: string) =>
    setCustomerData((prev) => ({ ...prev, [field]: value }));

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts((prev) => ({ ...prev, [productId]: quantity }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setShowPixInfo(method === "pix");

    if (method !== "dinheiro") {
      setNeedsChange(false);
      setChangeAmount("");
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText("40.597.532/0001-72");
    toast.success("Chave PIX copiada!");
  };

  const calculateTotal = () =>
    gasProducts.reduce((total, p) => {
      const price =
        deliveryType === "delivery" ? p.deliveryPrice : p.pickupPrice;

      const selected = selectedProducts[p.id] || 0;

      return total + (price || 0) * selected;
    }, 0);

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

  const saveOrderToFirebase = async () => {
    if (
      !customerData.name ||
      !customerData.phone ||
      Object.keys(selectedProducts).length === 0
    ) {
      alert(
        "Preencha todos os dados obrigatórios e selecione ao menos um produto."
      );
      return false;
    }

    // gera número único do pedido
    const numberOrder = await gerarNumeroUnico();
    if (typeof numberOrder !== "number") {
      alert("Erro ao gerar número do pedido. Tente novamente.");
      return false;
    }

    const selectedProductsForDB = Object.entries(selectedProducts)
      .map(([productId, quantity]) => {
        const product = gasProducts.find((p) => p.id === productId);
        if (!product) return null;
        return {
          product: {
            id: product.id,
            name: product.name,
            pickupPrice: product.pickupPrice,
            deliveryPrice: product.deliveryPrice,
            weight: product.weight,
          },
          quantity,
        };
      })
      .filter(Boolean) as OrderProduct[];

    const orderData: OrderData = {
      customer: customerData,
      products: selectedProductsForDB,
      numberOrder,
      deliveryType,
      paymentMethod,
      needsChange,
      changeAmount,
      status: "pending",
    };

    try {
      // salva o pedido
      await addDoc(collection(db, "pedidos"), {
        ...orderData,
        totalAmount: calculateTotal(),
        createdAt: Timestamp.now(),
      });

      // diminui o estoque dos produtos
      for (const { product, quantity } of selectedProductsForDB) {
        const productRef = doc(db, "produtos", product.id);
        await updateDoc(productRef, {
          quantity: increment(-quantity), // decrementa o estoque
        });
      }

      console.log("✅ Pedido salvo no Firebase e estoque atualizado!");
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido no sistema. Tente novamente.");
      return false;
    }
  };

  const generateWhatsAppMessage = () => {
  let message = `*NOVO PEDIDO # ${orders[0].numberOrder} - NORTE GÁS*\n\n`;

  message += `*DADOS DO CLIENTE:*\nNome: ${customerData.name}\nTelefone: ${customerData.phone}\n\n`;

  if (deliveryType === "delivery") {
    message += `*ENDEREÇO PARA ENTREGA:*\n${customerData.address}, ${customerData.number}\n`;
    message += `Bairro: ${customerData.neighborhood}\nCEP: ${customerData.cep}\n`;
    if (customerData.reference)
      message += `Referência: ${customerData.reference}\n`;
  } else {
    message += `*TIPO:* Retirada no local\n`;
  }

  message += `\n*PRODUTOS:*\n`;
  Object.entries(selectedProducts).forEach(([productId, quantity]) => {
    const product = gasProducts.find((p) => p.id === productId);
    if (product && quantity > 0) {
      const price =
        deliveryType === "delivery"
          ? product.deliveryPrice
          : product.pickupPrice;
      message += `${quantity}x ${product.name} - R$ ${price.toFixed(2)} cada\n`;
    }
  });

  message += `\n*TOTAL: R$ ${calculateTotal().toFixed(2)}*\n\n`;
  message += `*FORMA DE PAGAMENTO:* ${paymentMethod.toUpperCase()}\n`;

  if (paymentMethod === "dinheiro" && needsChange) {
    message += `Precisa de troco para: R$ ${changeAmount}\n`;
  }
  if (paymentMethod === "pix") {
    message += `⚠️ *LEMBRETE:* Enviar comprovante do PIX\n`;
  }

  const whatsappUrl = `https://wa.me/5532991440248?text=${encodeURIComponent(
    message
  )}`;
  window.open(whatsappUrl, "_blank");
};


  const resetForm = () => {
    setCustomerData({
      name: "",
      phone: "",
      address: "",
      number: "",
      neighborhood: "",
      cep: "",
      reference: "",
    });
    setGasProducts((prev) => prev.map((p) => ({ ...p, quantity: 0 })));
    setDeliveryType("delivery");
    setPaymentMethod("");
    setNeedsChange(false);
    setChangeAmount("");
    setShowPixInfo(false);
  };

  const handleSendOrder = async () => {
    const saved = await saveOrderToFirebase();
    if (saved) {
      generateWhatsAppMessage();
      resetForm();
      setOrderSuccess(true);
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length <= 10
      ? digits
          .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
          .replace(/-$/, "")
      : digits
          .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
          .replace(/-$/, "");
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 text-white p-6 text-center">
        <h2 className="text-4xl font-bold mb-6">
          ✅ Pedido realizado com sucesso!
        </h2>
        <p className="text-lg mb-8">
          Se desejar fazer outro pedido, clique no botão abaixo.
        </p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="bg-white text-green-700 font-bold py-4 px-8 rounded-2xl text-xl hover:bg-green-100 transition-all duration-300 shadow-lg"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent mb-8 flex items-center gap-3">
            <Home className="w-6 h-6" />
            Dados do Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) =>
                  handleCustomerDataChange("name", e.target.value)
                }
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                value={formatPhone(customerData.phone)}
                onChange={(e) => {
                  // Aceita somente números
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  handleCustomerDataChange("phone", onlyNumbers);
                }}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                placeholder="(32) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Delivery Type Selection */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Tipo de Pedido
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
                <input
                  type="radio"
                  name="deliveryType"
                  value="delivery"
                  checked={deliveryType === "delivery"}
                  onChange={(e) =>
                    setDeliveryType(e.target.value as "delivery" | "pickup")
                  }
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-semibold text-gray-800">🚚 Entrega</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-green-200 transition-all duration-300 hover:shadow-lg">
                <input
                  type="radio"
                  name="deliveryType"
                  value="pickup"
                  checked={deliveryType === "pickup"}
                  onChange={(e) =>
                    setDeliveryType(e.target.value as "delivery" | "pickup")
                  }
                  className="w-5 h-5 text-green-600"
                />
                <span className="font-semibold text-gray-800">🏪 Retirada</span>
              </label>
            </div>
          </div>

          {/* Address Fields - Only show for delivery */}
          {deliveryType === "delivery" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-600" />
                Endereço para Entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={customerData.address}
                    onChange={(e) =>
                      handleCustomerDataChange("address", e.target.value)
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                    placeholder="Rua, Avenida..."
                    required={deliveryType === "delivery"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={customerData.number}
                    onChange={(e) =>
                      handleCustomerDataChange("number", e.target.value)
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                    placeholder="123"
                    required={deliveryType === "delivery"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={customerData.neighborhood}
                    onChange={(e) =>
                      handleCustomerDataChange("neighborhood", e.target.value)
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                    placeholder="Nome do bairro"
                    required={deliveryType === "delivery"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={customerData.cep}
                    onChange={(e) =>
                      handleCustomerDataChange("cep", e.target.value)
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                    placeholder="00000-000"
                    required={deliveryType === "delivery"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={customerData.reference}
                    onChange={(e) =>
                      handleCustomerDataChange("reference", e.target.value)
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                    placeholder="Próximo ao..."
                  />
                </div>
              </div>
            </div>
          )}
          {deliveryType === "pickup" && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                📍 Local para Retirada
              </h3>
              <a
                href="https://maps.app.goo.gl/a7S1jcmv5zjZHbhP7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-all duration-300 hover:scale-105 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
              >
                <ExternalLink className="w-5 h-5" />
                Ver localização no Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Products Selection */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent mb-8">
            🛒 Selecione os Produtos
          </h2>

          <div className="space-y-6">
            {gasProducts.map((product: GasProduct) => {
              const stock = product.quantity ?? 0;
              const selected = selectedProducts[product.id] || 0;
              const isOutOfStock = stock === 0;
              const isMaxReached = selected >= stock;
              return (
                <div
                  key={product.id}
                  className={`bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {product.name} {product.weight} Kg
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2 text-lg">
                        <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                          🚚 Entrega: R$ {product.deliveryPrice.toFixed(2)}
                        </span>
                        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                          🏪 Retirada: R$ {product.pickupPrice.toFixed(2)}
                        </span>
                      </div>
                      {stock === 0 && (
                        <p className="text-sm text-red-600 mt-2 font-semibold">
                          ❌ Sem estoque disponível
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="text-sm font-semibold text-gray-700">
                        Quantidade:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleProductQuantityChange(
                              product.id,
                              selected - 1
                            )
                          }
                          disabled={selected <= 0}
                          className="w-10 h-10 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm font-bold disabled:opacity-50"
                        >
                          -
                        </button>

                        <span className="w-16 text-center font-bold text-lg bg-gray-100 py-2 rounded-lg">
                          {selected}
                        </span>
                        <button
                          onClick={() => {
                            if (isMaxReached) {
                              toast.error(
                                "Quantidade máxima em estoque atingida!"
                              );
                              return;
                            }
                            handleProductQuantityChange(
                              product.id,
                              selected + 1
                            );
                          }}
                          disabled={isOutOfStock || isMaxReached}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm font-bold disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-800">
                💰 Total:
              </span>
              <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                R$ {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent mb-8 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Forma de Pagamento
          </h2>

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

          {/* PIX Information */}
          {showPixInfo && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4 text-lg">
                📱 Informações do PIX
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-semibold text-gray-800">Chave PIX:</span>
                <span className="font-mono bg-white px-4 py-2 rounded-lg shadow-sm border font-bold text-blue-600">
                  40.597.532/0001-72
                </span>
                <button
                  onClick={copyPixKey}
                  className="p-2 text-blue-600 hover:text-blue-800 bg-white rounded-lg hover:bg-blue-50 transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Copiar chave PIX"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-200">
                ⚠️ IMPORTANTE: Envie o comprovante do PIX após o pagamento!
              </p>
            </div>
          )}
        </div>

        {/* Send Order Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleSendOrder}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-5 px-10 rounded-2xl text-xl flex items-center gap-4 mx-auto transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl border border-green-400"
          >
            <MessageCircle className="w-7 h-7" />
            Enviar Pedido via WhatsApp
          </button>
        </div>

        {/* Footer */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-gray-700 font-medium">
                Este app foi criado e desenvolvido por G MAPS CONTACT CENTER
                LTDA
              </span>

              <span className="text-sm text-gray-700 font-semibold">
                0800 580 2766
              </span>
            </div>

            <div className="text-sm text-gray-700 font-medium">
              Este pedido é de responsabilidade da empresa NORTE GÁS (32)
              99144-0248
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserScreen;
