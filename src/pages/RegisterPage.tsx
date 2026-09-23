// ─────────────────────────────────────────────────────────────────
// src/pages/RegisterPage.tsx
// Página de registro con validación de contraseñas en cliente.
// Incluye botón de tema (dark/light) accesible antes de registrarse.
// ─────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validación lado cliente
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al registrarse.';
      setError(mapFirebaseError(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Indicador visual de fortaleza de contraseña
  const passwordStrength = getPasswordStrength(password);

  return (
    <main className="auth-page">
      {/* Botón de tema — esquina superior derecha, antes del registro */}
      <div className="auth-theme-toggle">
        <button
          id="register-theme-toggle"
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
            <UserPlus size={28} />
          </div>
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Empezá a gestionar tus tareas</p>
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
            <label htmlFor="register-email" className="form-label">
              Email
            </label>
            <div className="form-input-wrapper">
              <Mail size={16} className="form-input-icon" />
              <input
                id="register-email"
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
            <label htmlFor="register-password" className="form-label">
              Contraseña
            </label>
            <div className="form-input-wrapper">
              <Lock size={16} className="form-input-icon" />
              <input
                id="register-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />
            </div>
            {/* Barra de fortaleza de contraseña */}
            {password.length > 0 && (
              <div className="password-strength" aria-label={`Fortaleza: ${passwordStrength.label}`}>
                <div
                  className={`password-strength-bar password-strength--${passwordStrength.level}`}
                />
                <span className="password-strength-label">{passwordStrength.label}</span>
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="register-confirm" className="form-label">
              Confirmar contraseña
            </label>
            <div className="form-input-wrapper">
              <Lock size={16} className="form-input-icon" />
              <input
                id="register-confirm"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
                autoComplete="new-password"
              />
              {/* Indicador de coincidencia */}
              {confirmPassword.length > 0 && (
                <span className="form-input-status" aria-hidden="true">
                  {password === confirmPassword ? (
                    <CheckCircle size={16} className="status-ok" />
                  ) : (
                    <AlertCircle size={16} className="status-error" />
                  )}
                </span>
              )}
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="auth-link">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong';
  label: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return { level: 'weak', label: 'Débil' };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 2) return { level: 'strong', label: 'Fuerte' };
  return { level: 'medium', label: 'Media' };
}

function mapFirebaseError(message: string): string {
  if (message.includes('email-already-in-use'))
    return 'Ya existe una cuenta con este email.';
  if (message.includes('invalid-email'))
    return 'El email no es válido.';
  if (message.includes('weak-password'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('network-request-failed'))
    return 'Sin conexión a internet. Revisá tu red.';
  return 'Ocurrió un error. Intentá nuevamente.';
}
