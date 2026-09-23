// ─────────────────────────────────────────────────────────────────
// src/hooks/useAuth.ts
// Hook consumidor del AuthContext. Centraliza el guard de contexto
// nulo y provee un error descriptivo si se usa fuera del Provider.
// ─────────────────────────────────────────────────────────────────

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../types';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth() debe usarse dentro de un <AuthProvider>. ' +
      'Asegurate de que AuthProvider envuelve tu árbol de componentes en App.tsx.'
    );
  }

  return context;
}
