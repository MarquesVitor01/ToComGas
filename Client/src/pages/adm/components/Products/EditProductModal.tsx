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

  useEffect(() => {
    if (product) {
      setName(product.name);
      setWeight(product.weight);
      setPickupPrice(
        new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 })
          .format(Number(product.pickupPrice))
      );
      setDeliveryPrice(
        new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 })
          .format(Number(product.deliveryPrice))
      );
    } else {
      setName("");
      setWeight("");
      setPickupPrice("");
      setDeliveryPrice("");
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
    });
    onClose(); // fecha após salvar
  };

  // 🔥 aqui está a correção
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal-content p-4 rounded bg-white max-w-md mx-auto mt-20 shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {product ? "Editar Produto" : "Criar Produto"}
        </h2>
        <div className="flex flex-col gap-2 mb-4">
          <input
            className="border rounded px-2 py-1"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Peso (ex: 13,5)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Preço Retirada"
            value={pickupPrice}
            onChange={(e) => setPickupPrice(formatCurrency(e.target.value))}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Preço Entrega"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(formatCurrency(e.target.value))}
          />
        </div>
        <div className="flex justify-center gap-2">
          <button className="btn btn-primary" onClick={handleSave}>
            {product ? "Salvar" : "Criar"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};


export default EditProductModal;
