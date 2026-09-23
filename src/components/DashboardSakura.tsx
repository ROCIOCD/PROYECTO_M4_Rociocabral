// ─────────────────────────────────────────────────────────────────
// src/components/DashboardSakura.tsx
// Versión diferenciada del fondo sakura para el área de trabajo:
//   · Solo 6 pétalos en pantalla, muy lentos (14-22s) y translúcidos
//   · Ramas decorativas PEQUEÑAS y FIJAS en las 4 esquinas
//   · No interfiere con la lectura ni la gestión de tareas
//   · aria-hidden — invisible para lectores de pantalla
// ─────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react';

// ── Flor de cerezo mini (para esquinas del dashboard) ────────────
interface MiniFlowerProps { x: number; y: number; size?: number; opacity?: number; }

function MiniFlower({ x, y, size = 1, opacity = 0.55 }: MiniFlowerProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${size})`} opacity={opacity}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-9} rx={5.5} ry={8} className="sk-petal"
          transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={3.5} className="sk-center" />
    </g>
  );
}

// ── 6 pétalos flotantes — muy lentos y translúcidos ──────────────
interface DashPetal { left: string; dur: string; delay: string; drift: string; rot: string; sz: string; }
const DASH_PETALS: DashPetal[] = [
  { left: '5%',  dur: '20s', delay: '0s',    drift: '50px',  rot: '1turn',  sz: '8px'  },
  { left: '22%', dur: '17s', delay: '-6s',   drift: '-45px', rot: '-1turn', sz: '7px'  },
  { left: '42%', dur: '22s', delay: '-12s',  drift: '60px',  rot: '2turn',  sz: '9px'  },
  { left: '63%', dur: '18s', delay: '-4s',   drift: '-55px', rot: '-1turn', sz: '7px'  },
  { left: '78%', dur: '21s', delay: '-9s',   drift: '40px',  rot: '1turn',  sz: '8px'  },
  { left: '91%', dur: '16s', delay: '-15s',  drift: '-35px', rot: '-2turn', sz: '6px'  },
];

// ── Componente principal ─────────────────────────────────────────
export function DashboardSakura() {
  return (
    <div className="ds-bg" aria-hidden="true">

      {/* ── Esquina superior izquierda — rama pequeña ─────────── */}
      <svg className="ds-corner ds-corner--tl" viewBox="0 0 220 180"
        xmlns="http://www.w3.org/2000/svg" fill="none">
        <path className="sk-branch ds-branch" strokeWidth={3.5}
          d="M 5 90 C 35 45 85 65 115 55" />
        <path className="sk-branch ds-branch" strokeWidth={2.5}
          d="M 115 55 C 145 42 170 20 195 25" />
        <path className="sk-branch ds-branch" strokeWidth={2}
          d="M 115 55 C 110 78 100 105 92 128" />
        <MiniFlower x={115} y={55}  size={1.0} opacity={0.50} />
        <MiniFlower x={195} y={25}  size={0.85} opacity={0.42} />
        <MiniFlower x={92}  y={128} size={0.80} opacity={0.40} />
        <MiniFlower x={60}  y={58}  size={0.70} opacity={0.35} />
      </svg>

      {/* ── Esquina superior derecha — rama pequeña ───────────── */}
      <svg className="ds-corner ds-corner--tr" viewBox="0 0 220 180"
        xmlns="http://www.w3.org/2000/svg" fill="none">
        <path className="sk-branch ds-branch" strokeWidth={3.5}
          d="M 215 90 C 185 45 135 65 105 55" />
        <path className="sk-branch ds-branch" strokeWidth={2.5}
          d="M 105 55 C 75 42 50 20 25 25" />
        <path className="sk-branch ds-branch" strokeWidth={2}
          d="M 105 55 C 110 78 120 105 128 128" />
        <MiniFlower x={105} y={55}  size={1.0}  opacity={0.50} />
        <MiniFlower x={25}  y={25}  size={0.85} opacity={0.42} />
        <MiniFlower x={128} y={128} size={0.80} opacity={0.40} />
        <MiniFlower x={160} y={58}  size={0.70} opacity={0.35} />
      </svg>

      {/* ── Esquina inferior izquierda — rama mínima ─────────── */}
      <svg className="ds-corner ds-corner--bl" viewBox="0 0 160 140"
        xmlns="http://www.w3.org/2000/svg" fill="none">
        <path className="sk-branch ds-branch" strokeWidth={2.5}
          d="M 5 135 C 25 100 60 88 90 80" />
        <path className="sk-branch ds-branch" strokeWidth={2}
          d="M 90 80 C 115 68 135 45 150 38" />
        <MiniFlower x={90}  y={80}  size={0.85} opacity={0.40} />
        <MiniFlower x={150} y={38}  size={0.72} opacity={0.35} />
      </svg>

      {/* ── Esquina inferior derecha — rama mínima ────────────── */}
      <svg className="ds-corner ds-corner--br" viewBox="0 0 160 140"
        xmlns="http://www.w3.org/2000/svg" fill="none">
        <path className="sk-branch ds-branch" strokeWidth={2.5}
          d="M 155 135 C 135 100 100 88 70 80" />
        <path className="sk-branch ds-branch" strokeWidth={2}
          d="M 70 80 C 45 68 25 45 10 38" />
        <MiniFlower x={70}  y={80}  size={0.85} opacity={0.40} />
        <MiniFlower x={10}  y={38}  size={0.72} opacity={0.35} />
      </svg>

      {/* ── 6 pétalos muy lentos ─────────────────────────────── */}
      {DASH_PETALS.map((p, i) => (
        <div key={i} className="ds-petal" style={{
          left:   p.left,
          width:  p.sz,
          height: p.sz,
          '--ds-dur':   p.dur,
          '--ds-delay': p.delay,
          '--ds-drift': p.drift,
          '--ds-rot':   p.rot,
        } as CSSProperties} />
      ))}
    </div>
  );
}
