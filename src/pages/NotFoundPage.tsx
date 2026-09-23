// ─────────────────────────────────────────────────────────────────
// src/pages/NotFoundPage.tsx
// Página 404 para rutas no definidas.
// ─────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-content">
        <SearchX size={72} className="not-found-icon" aria-hidden="true" />
        <h1 id="not-found-title" className="not-found-code">404</h1>
        <p className="not-found-title">Página no encontrada</p>
        <p className="not-found-sub">
          La URL que ingresaste no existe o fue movida.
        </p>
        <Link to="/" className="btn btn-primary" id="not-found-home-link">
          <Home size={16} />
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
