import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: any;
  nome: string;
  avatar: string;
  cargo: string;
  userId: string;
  loading: boolean;
  logout: () => Promise<void>;
  userData: any; 
  setUserData: React.Dispatch<React.SetStateAction<any>>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [nome, setNome] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [cargo, setCargo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const lastProcessedUser = useRef<string | null>(null);

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (lastProcessedUser.current === user.uid && nome && avatar !== undefined) {
        return;
      }

      lastProcessedUser.current = user.uid;
      setUser(user);

      const email = user.email || "";
      const nomeUsuario = email.split("@")[0];
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setNome(nomeUsuario);
        setAvatar(data?.avatar || "");
        setCargo(data?.cargo || "");
      } else {
        await setDoc(docRef, {
          nome: nomeUsuario,
          email,
          avatar: "",
          cargo: "",
        });
        setNome(nomeUsuario);
        setAvatar("");
        setCargo("");
      }
    } else {
      setUser(null);
      setNome("");
      setAvatar("");
      setCargo("");
      lastProcessedUser.current = null;
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, [nome, avatar]);


  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setNome("");
      setAvatar("");
      setCargo("");
      setUserData(null); 
      lastProcessedUser.current = null;
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        nome,
        avatar,
        cargo,
        userId: user?.uid || "",
        loading,
        logout,
        userData, 
        setUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
