// ─────────────────────────────────────────────────────────────────
// src/hooks/useTheme.ts
// Hook consumidor del ThemeContext con guard de contexto nulo.
// ─────────────────────────────────────────────────────────────────

import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type { ThemeContextType } from '../types';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error(
      'useTheme() debe usarse dentro de un <ThemeProvider>. ' +
      'Asegurate de que ThemeProvider envuelve tu árbol en App.tsx.'
    );
  }

  return context;
}
