import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const useLogoutUser = () => {
  const navigate = useNavigate();

  const logoutUser = async () => {
    const auth = getAuth();

    try {
      await signOut(auth);
      console.log("Usuário deslogado com sucesso!");
      navigate("/login-acess"); 
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return logoutUser;
};
