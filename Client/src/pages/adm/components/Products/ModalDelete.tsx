// ModalRoutes.tsx
interface ModalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onConfirm?: () => void;
}

export const ModalDelete: React.FC<ModalDeleteProps> = ({
  isOpen,
  onClose,
  message,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm transform transition-all">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
          Confirmação
        </h2>
        <p className="text-gray-600 text-sm text-center">{message}</p>

        <div className="flex gap-3 justify-center mt-6">
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            onClick={() => {
              if (onConfirm) onConfirm();
            }}
          >
            Confirmar
          </button>
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
