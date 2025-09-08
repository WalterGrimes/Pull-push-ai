// src/Form/ResetPassword.tsx
import { useState, FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import './Login.css'

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Письмо для сброса пароля отправлено на ваш email");
    } catch (error: any) {
      setError(error.message);
      console.error("Ошибка сброса пароля:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleReset} className="auth-form">
        <h2>Сброс пароля</h2>
        
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
        
        <button type="submit" disabled={loading}>
          {loading ? "Отправка..." : "Отправить ссылку"}
        </button>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        <div className="auth-links">
          <Link to="/login">Вспомнили пароль? Войдите</Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;