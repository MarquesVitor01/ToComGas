import React, { useState, useEffect } from "react";
import { GasProduct } from "../../../../types";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: GasProduct | null;
  onSave: (product: Omit<GasProduct, "id"> & { id?: string }) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [pickupPrice, setPickupPrice] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setWeight(product.weight);
      setQuantity(product.quantity);
      setPickupPrice(
        new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(
          Number(product.pickupPrice)
        )
      );
      setDeliveryPrice(
        new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(
          Number(product.deliveryPrice)
        )
      );
    } else {
      setName("");
      setWeight("");
      setPickupPrice("");
      setDeliveryPrice("");
      setQuantity(0);
    }
  }, [product, isOpen]);

  const formatCurrency = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    const number = parseFloat(numeric) / 100;
    if (isNaN(number)) return "";
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
  };

  const handleSave = () => {
    onSave({
      id: product?.id,
      name,
      weight,
      pickupPrice: parseCurrency(pickupPrice),
      deliveryPrice: parseCurrency(deliveryPrice),
      quantity,
    });
    onClose(); 
  };

  // 🔥 aqui está a correção
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeInScale">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {product ? "Editar Produto" : "Criar Produto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col space-y-4 mb-6">
          {/* Nome */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Nome do Produto
            </label>
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Botijão de Gás"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Peso */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Peso</label>
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 13,5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Quantidade de estoque
            </label>
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 10"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          {/* Preço Retirada */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Preço Retirada
            </label>
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: R$ 90,00"
              value={pickupPrice}
              onChange={(e) => setPickupPrice(formatCurrency(e.target.value))}
            />
          </div>

          {/* Preço Entrega */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
              Preço Entrega
            </label>
            <input
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: R$ 95,00"
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(formatCurrency(e.target.value))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={handleSave}
          >
            {product ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
