import { useState, FormEvent, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import AvatarUploader from "../components/AvatarUploader";
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Редирект после успешной регистрации
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    // Валидация полей
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (!nickname.trim()) {
      setError("Введите никнейм");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Создаем пользователя
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Обновляем профиль
      await updateProfile(user, {
        displayName: nickname,
        photoURL: photoURL || null,
      });

      // 3. Сохраняем доп. данные в Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        nickname: nickname.trim(),
        photoURL: photoURL || null,
        description: description.trim(),
        pushupRecord: 0,
        pullupRecord: 0,
        pushupRecordDate: null,
        pullupRecordDate: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      setSuccess(true); // Устанавливаем флаг успеха

    } catch (error: any) {
      console.error("Полная ошибка регистрации:", error);
      
      let errorMessage = "Ошибка регистрации";
      switch(error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Этот email уже зарегистрирован";
          break;
        case "auth/invalid-email":
          errorMessage = "Неверный формат email";
          break;
        case "auth/weak-password":
          errorMessage = "Пароль должен содержать минимум 6 символов";
          break;
        case "auth/network-request-failed":
          errorMessage = "Проблемы с интернет-соединением";
          break;
        case "auth/too-many-requests":
          errorMessage = "Слишком много запросов. Попробуйте позже";
          break;
        default:
          errorMessage = `Ошибка: ${error.code || "неизвестная ошибка"}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2>Регистрация</h2>
        
        {success ? (
          <div className="success-message">
            <h3>Регистрация успешно завершена! ✅</h3>
            <p>Сейчас вы будете перенаправлены на главную страницу...</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль (мин. 6 символов)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="nickname">Никнейм</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ваш никнейм"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Фото профиля (необязательно)</label>
              <AvatarUploader 
                onUpload={setPhotoURL} 
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">О себе (необязательно)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите немного о себе..."
                rows={3}
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Идет регистрация...(если загрузка идет слишком долго,попробуйте перезагрузить страницу)
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </button>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="auth-links">
              <p>Уже есть аккаунт? <Link to="/login">Войдите</Link></p>
              <p><Link to="/reset-password">Забыли пароль?</Link></p>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Register;