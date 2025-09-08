// src/Form/Login.tsx
import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Перенаправляем на главную после успешного входа
    } catch (error: any) {
      let errorMessage = "Ошибка входа";
      
      // Более дружелюбные сообщения об ошибках
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Неверный формат email";
          break;
        case "auth/user-not-found":
          errorMessage = "Пользователь не найден";
          break;
        case "auth/wrong-password":
          errorMessage = "Неверный пароль";
          break;
        case "auth/too-many-requests":
          errorMessage = "Слишком много попыток. Попробуйте позже";
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      console.error("Ошибка входа:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2>Вход в аккаунт</h2>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ваш email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ваш пароль"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="auth-links">
          <Link to="/register">Нет аккаунта? Зарегистрируйтесь</Link>
          <Link to="/reset-password">Забыли пароль?</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;