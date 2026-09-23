// ─────────────────────────────────────────────────────────────────
// src/context/ThemeContext.tsx
// Gestiona el tema global (dark/light). Persiste en localStorage
// y aplica el atributo data-theme en <html> para que las variables
// CSS del sistema de diseño se activen sin JS en el renderizado.
// ─────────────────────────────────────────────────────────────────

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Theme, ThemeContextType } from '../types';

export const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'matecode-theme';

function getInitialTheme(): Theme {
  // 1. Preferencia guardada en localStorage
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  // 2. Preferencia del sistema operativo
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Aplica data-theme en <html> cada vez que cambia el tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
