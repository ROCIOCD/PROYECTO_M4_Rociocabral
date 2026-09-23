// ─────────────────────────────────────────────────────────────────
// src/components/ProtectedRoute.tsx
// Guard declarativo para rutas que requieren sesión activa.
// Mientras Firebase resuelve el estado inicial (loading), muestra
// un spinner accesible y no redirige, evitando false-negatives.
// ─────────────────────────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ── Spinner accesible mientras se resuelve la sesión ─────────────
function AuthLoader() {
  return (
    <div
      role="status"
      aria-label="Verificando sesión..."
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg, #0f172a)',
      }}
    >
      <div className="auth-spinner" />
    </div>
  );
}

// ── Guard principal ───────────────────────────────────────────────
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  // 1. Firebase todavía está resolviendo la sesión persistida → spinner
  if (loading) return <AuthLoader />;

  // 2. No hay usuario autenticado → redirigir al login
  //    `replace` evita que el botón "atrás" del navegador vuelva aquí
  if (!user) return <Navigate to="/login" replace />;

  // 3. Usuario autenticado → renderizar la ruta hija
  return <Outlet />;
}
