// src/components/AuthSwitcher.tsx
import { Link } from "react-router-dom";

export default function AuthSwitcher({ isLogin }: { isLogin: boolean }) {
  return (
    <div className="auth-switcher">
      {isLogin ? (
        <p>
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      ) : (
        <p>
          Уже есть аккаунт? <Link to="/login">Войдите</Link>
        </p>
      )}
    </div>
  );
}