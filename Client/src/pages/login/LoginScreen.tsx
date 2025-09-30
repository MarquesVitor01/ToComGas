import { useState, FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase/firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
// import './login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [recuperar, setRecuperar] = useState<boolean>(false);
  const [recuperarEmail, setRecuperarEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [showCircles, setShowCircles] = useState<boolean>(false);

  const circlesRef = useRef<HTMLDivElement[]>([]);
  const navigate = useNavigate();

  const recuperador_senha = () => {
    setRecuperar(!recuperar);
    setError('');
  };

  const handleLogin = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/adm-acess');
    } catch (erro) {
      console.log(erro);
      setError('Ocorreu um erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setResetSuccess('');

    if (!recuperarEmail) {
      setError('Por favor, insira o seu email.');
      return;
    }


    try {
      await sendPasswordResetEmail(auth, recuperarEmail);
      setResetSuccess('Um email de recuperação foi enviado.');
    } catch (erro) {
      console.log(erro);
      setError('Erro ao enviar email de recuperação.');
    }
  };

  const handleInputChange = () => setError('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin(e as unknown as FormEvent<HTMLButtonElement>);
    }
  };

  useEffect(() => {
    const circles = circlesRef.current;

    const handleMouseEnter = (circle: HTMLDivElement) => {
      circle.classList.remove('surging');
    };

    const handleMouseLeave = (circle: HTMLDivElement) => {
      circle.classList.add('surging');
    };

    circles.forEach(circle => {
      circle.addEventListener('mouseenter', () => handleMouseEnter(circle));
      circle.addEventListener('mouseleave', () => handleMouseLeave(circle));
    });

    return () => {
      circles.forEach(circle => {
        circle.removeEventListener('mouseenter', () => handleMouseEnter(circle));
        circle.removeEventListener('mouseleave', () => handleMouseLeave(circle));
      });
    };
  }, []);

  useEffect(() => {
    if (recuperar) {
      setShowCircles(true);
    }
  }, [recuperar]);

  return (
    <section>
      {/* Decoração pode ser adaptada para Tailwind se necessário */}
      <div className="min-h-screen bg-gradient-to-r from-[#464e80] to-[#800020] flex items-center justify-center relative">
        <div className={`w-full max-w-md bg-white/90 rounded-2xl p-8 shadow-lg flex flex-col items-center ${recuperar ? 'hidden' : ''}`}> 
          <h1 className="text-3xl font-bold text-center mb-6 mt-2 text-gray-900">Login</h1>
          <div className="flex flex-col gap-4 w-full">
            <input
              type="email"
              id="emailField"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o seu email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); handleInputChange(); }}
              onKeyDown={handleKeyDown}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="passwordField"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Insira sua senha"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); handleInputChange(); }}
                onKeyDown={handleKeyDown}
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-600 cursor-pointer text-xl"
              />
            </div>
            <button onClick={handleLogin} className="w-4/5 mx-auto bg-indigo-400 hover:bg-indigo-600 text-white font-semibold rounded-lg py-2 text-lg transition disabled:opacity-60" disabled={loading}>
              {loading ? 'Carregando...' : 'Login'}
            </button>
            {error && <div className="text-red-600 text-center text-sm mt-2">{error}</div>}
          </div>
          <div className="text-center mt-8">
            <small className="text-gray-700">Esqueceu a senha?
              <Link to={''} onClick={recuperador_senha} className="ml-2 text-blue-700 hover:underline cursor-pointer">
                {recuperar ? 'Fazer Login' : 'Recuperar Senha'}
              </Link>
            </small>
          </div>
        </div>

        {recuperar && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            {/* Círculos animados podem ser adaptados para Tailwind se necessário */}
            {showCircles && Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`absolute rounded-full bg-white/60 blur-2xl animate-pulse`} style={{ width: `${30 + index * 10}px`, height: `${30 + index * 10}px`, top: `${10 + index * 10}%`, left: `${10 + index * 12}%`, opacity: 0.5 }} ref={(el) => el && (circlesRef.current[index] = el)}></div>
            ))}

            <div className="relative flex flex-col items-center justify-center gap-8 w-[350px] md:w-[450px] h-[350px] md:h-[400px] bg-white/80 rounded-2xl shadow-xl px-6">
              <h2 className="text-2xl font-bold text-gray-900">Recuperar Senha</h2>
              <input
                type="email"
                placeholder='Digite seu email'
                className='w-4/5 border border-gray-400 rounded-lg px-3 py-2 text-center text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                value={recuperarEmail}
                onChange={(e) => { setRecuperarEmail(e.target.value); setError(''); }}
              />
              <div className="flex gap-4 justify-center w-full">
                <button onClick={handlePasswordReset} className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-6 py-2 transition">Enviar</button>
                <button onClick={() => setRecuperar(false)} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition absolute top-2 right-2">
                  <FontAwesomeIcon icon={faClose} />
                </button>
              </div>
              {error && <div className="text-red-600 text-center text-sm mt-2">{error}</div>}
              {resetSuccess && <div className="text-green-600 text-center text-sm mt-2">{resetSuccess}</div>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LoginScreen;