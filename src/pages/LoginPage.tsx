// ─────────────────────────────────────────────────────────────────
// src/pages/LoginPage.tsx
// Página de inicio de sesión con formulario controlado.
// Incluye botón de tema (dark/light) accesible antes de autenticarse.
// ─────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SakuraBackground } from '../components/SakuraBackground';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setError(mapFirebaseError(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      {/* Fondo decorativo sakura (ramas SVG + pétalos animados) */}
      <SakuraBackground />

      {/* Botón de tema — esquina superior derecha */}
      <div className="auth-theme-toggle">
        <button
          id="login-theme-toggle"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="auth-card">
        {/* Header */}
        <header className="auth-header">
          <div className="auth-logo">
            <LogIn size={28} />
          </div>
          <h1 className="auth-title">Bienvenido</h1>
          <p className="auth-subtitle">Iniciá sesión en tu cuenta</p>
        </header>

        {/* Error banner */}
        {error && (
          <div className="auth-error" role="alert" aria-live="polite">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-field">
            <label htmlFor="login-email" className="form-label">
              Email
            </label>
            <div className="form-input-wrapper">
              <Mail size={16} className="form-input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="login-password" className="form-label">
              Contraseña
            </label>
            <div className="form-input-wrapper">
              <Lock size={16} className="form-input-icon" />
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="auth-link">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}

// ── Mapea mensajes de error de Firebase a textos en español ──────
function mapFirebaseError(message: string): string {
  if (message.includes('user-not-found') || message.includes('INVALID_LOGIN_CREDENTIALS'))
    return 'Email o contraseña incorrectos.';
  if (message.includes('wrong-password'))
    return 'La contraseña es incorrecta.';
  if (message.includes('too-many-requests'))
    return 'Demasiados intentos. Intentá más tarde.';
  if (message.includes('network-request-failed'))
    return 'Sin conexión a internet. Revisá tu red.';
  return 'Ocurrió un error. Intentá nuevamente.';
}
