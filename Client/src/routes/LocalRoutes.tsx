import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../config/context/AuthContext";
import Adm from "../pages/adm/AdmScreen";
import UserScreen from "../pages/user/components/UserScreen";
import LoginScreen from "../pages/login/LoginScreen";
import PrivateRoute from "./PrivatesRoute";

export const LocalRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserScreen />} />
          <Route path="/login-acess" element={<LoginScreen />} />
          <Route path="/adm-acess" element={<PrivateRoute element={<Adm />} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
