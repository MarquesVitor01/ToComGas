import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../config/firebase/firebaseConfig";
import { GasProduct } from "../../../../types";
import EditProductModal from "./EditProductModal";
import { Edit, Trash, Plus } from "lucide-react";

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<GasProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GasProduct | null>(
    null
  );
  const [productToDelete, setProductToDelete] = useState<GasProduct | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "produtos"));
      const fetchedProducts: GasProduct[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<GasProduct, "id">;
        return {
          id: doc.id,
          name: data.name ?? "",
          weight: data.weight ?? "",
          quantity: data.quantity ?? 0,
          pickupPrice:
            typeof data.pickupPrice === "number"
              ? data.pickupPrice
              : parseFloat(String(data.pickupPrice).replace(",", ".")) || 0,

          deliveryPrice:
            typeof data.deliveryPrice === "number"
              ? data.deliveryPrice
              : parseFloat(String(data.deliveryPrice).replace(",", ".")) || 0,
        };
      });
      setProducts(fetchedProducts);
    };
    fetchProducts();
  }, []);
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.weight.includes(searchTerm)
  );

  const handleEdit = (product: GasProduct) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setNewProductModalOpen(true);
  };

  const handleCreateNewProduct = async (product: Omit<GasProduct, "id">) => {
    try {
      const { name, weight, pickupPrice, deliveryPrice, quantity } = product;

      const docRef = await addDoc(collection(db, "produtos"), {
        name,
        weight,
        pickupPrice,
        deliveryPrice,
        quantity,
      });

      setProducts((prev) => [...prev, { id: docRef.id, ...product }]);
      setNewProductModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar produto:", error);
    }
  };

  const handleSaveEdit = async (
    updated: Omit<GasProduct, "id"> & { id?: string }
  ) => {
    if (!updated.id) return;

    try {
      // Referência ao documento no Firestore
      const productRef = doc(db, "produtos", updated.id);

      // Atualiza os campos no Firestore
      await updateDoc(productRef, {
        name: updated.name,
        weight: updated.weight,
        pickupPrice: updated.pickupPrice,
        deliveryPrice: updated.deliveryPrice,
        quantity: updated.quantity,
      });
      const updatedProduct: GasProduct = {
        id: updated.id,
        name: updated.name,
        weight: updated.weight,
        pickupPrice: updated.pickupPrice,
        deliveryPrice: updated.deliveryPrice,
        quantity: updated.quantity,
      };

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );

      setEditModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  };

  const handleDelete = async (product: GasProduct) => {
    if (!product.id) return;
    try {
      await deleteDoc(doc(db, "produtos", product.id));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produtos</h2>
            <p className="text-gray-600">Veja todos os produtos disponíveis</p>
          </div>
          <button
            onClick={handleNewProduct}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nome ou peso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <span role="img" className="text-2xl mb-2">
              🔍
            </span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500">Tente ajustar o termo de busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 shadow-sm bg-white flex flex-col items-start w-full"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-1">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between w-full">
                  <span className="text-gray-500 mb-2">
                    {product.weight} kg
                  </span>

                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-1 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      className="px-1 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
                <span
                  className={`font-bold text-gray-500 text-sm ${
                    product.quantity <= 1
                      ? "text-red-500"
                      : product.quantity < 5
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  Estoque: {product.quantity}
                </span>
                <span className="text-blue-600 font-bold text-xl mb-2">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(product.pickupPrice)}
                  {" / "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(product.deliveryPrice)}
                </span>
              </div>
            ))}
          </div>
        )}

        {deleteModalOpen && productToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Confirmação
              </h2>
              <p className="mt-3 text-gray-600">
                Tem certeza que deseja excluir o produto{" "}
                <span className="font-medium text-red-600">
                  "{productToDelete.name}"
                </span>
                ?
              </p>

              <div className="flex gap-3 justify-center mt-6">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg shadow transition-colors"
                  onClick={() => handleDelete(productToDelete)}
                >
                  Excluir
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-5 py-2 rounded-lg shadow transition-colors"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={handleSaveEdit}
      />

      <EditProductModal
        isOpen={newProductModalOpen}
        onClose={() => setNewProductModalOpen(false)}
        product={null}
        onSave={handleCreateNewProduct}
      />
    </>
  );
};

export default ProductsList;
