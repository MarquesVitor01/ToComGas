import React, { useEffect, useState } from "react"; 
import { Navigate } from "react-router-dom";
import { useAuth } from "../config/context/AuthContext";
import { CircularProgress } from "@mui/material";
import { ModalRoutes } from "./components/ModalRoutes";

interface PrivateRouteProps {
  element: JSX.Element;
  requiredCargo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, requiredCargo }) => {
  const { user, loading, cargo } = useAuth();
  const adminId = import.meta.env.VITE_ADMIN_USER_ID;
  const [modalOpen, setModalOpen] = useState(false); 
  const [redirect, setRedirect] = useState(false); 

  useEffect(() => {
    if (!loading && user && !((user.uid === adminId) || !requiredCargo || cargo === requiredCargo)) {
      setModalOpen(true); 
    }
  }, [loading, user, requiredCargo, cargo, adminId]); 

  const handleCloseModal = () => {
    setModalOpen(false);
    setRedirect(true); 
  };

  if (loading) {
    return (
      <div className="circle-loading">
        <CircularProgress color="inherit" className="circle" />
      </div>
    );
  }

  if (redirect) {
    return <Navigate to="/" />; 
  }

  if (user && ((user.uid === adminId) || !requiredCargo || cargo === requiredCargo)) {
    return element; 
  }

  return (
    <>
      <ModalRoutes
        isOpen={modalOpen}
        onClose={handleCloseModal}
        message="Verifique suas credenciais! Redirecionando para a página inicial."
      />
    </>
  );
};

export default PrivateRoute;
