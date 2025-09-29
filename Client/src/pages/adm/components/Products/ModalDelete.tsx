// ModalRoutes.tsx
interface ModalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  onConfirm?: () => void; // <-- adiciona aqui
}

export const ModalDelete: React.FC<ModalDeleteProps> = ({ isOpen, onClose, message, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="flex gap-2 justify-center mt-4">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (onConfirm) onConfirm();
            }}
          >
            Confirmar
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
