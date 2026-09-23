// ─────────────────────────────────────────────────────────────────
// src/components/SakuraBackground.tsx
// Fondo decorativo de flores de cerezo (sakura) para las páginas
// de autenticación. Utiliza SVG inline para ramas y flores, y
// divs animados para pétalos flotantes. Se adapta automáticamente
// al tema dark/light mediante variables CSS. aria-hidden para
// no afectar la accesibilidad del formulario principal.
// ─────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react';

// ── Tipos internos ───────────────────────────────────────────────
interface FlowerProps {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
}

// Pétalo de cerezo — 5 elipses rotadas alrededor del centro
function CherryFlower({ x, y, size = 1, opacity = 0.75 }: FlowerProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${size})`} opacity={opacity}>
      {/* 5 pétalos en 72° */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx={0}
          cy={-12}
          rx={7}
          ry={10.5}
          className="sk-petal"
          transform={`rotate(${angle})`}
        />
      ))}
      {/* Centro dorado */}
      <circle cx={0} cy={0} r={4.5} className="sk-center" />
      <circle cx={0} cy={0} r={2} className="sk-center-inner" />
    </g>
  );
}

// ── Pétalos cayendo ──────────────────────────────────────────────
interface FallingPetal {
  left: string;
  width: string;
  height: string;
  duration: string;
  delay: string;
  drift: string;
  rotate: string;
}

const FALLING_PETALS: FallingPetal[] = [
  { left: '6%',  width: '10px', height: '10px', duration: '9s',  delay: '0s',    drift: '65px',  rotate: '1turn'  },
  { left: '18%', width: '8px',  height: '8px',  duration: '7s',  delay: '-2.5s', drift: '-55px', rotate: '-1turn' },
  { left: '30%', width: '11px', height: '11px', duration: '11s', delay: '-5s',   drift: '45px',  rotate: '2turn'  },
  { left: '44%', width: '7px',  height: '7px',  duration: '8s',  delay: '-1.5s', drift: '-70px', rotate: '-1turn' },
  { left: '58%', width: '9px',  height: '9px',  duration: '10s', delay: '-4s',   drift: '60px',  rotate: '1turn'  },
  { left: '72%', width: '8px',  height: '8px',  duration: '6.5s',delay: '-3s',   drift: '-40px', rotate: '-2turn' },
  { left: '84%', width: '10px', height: '10px', duration: '9.5s',delay: '-7s',   drift: '35px',  rotate: '1turn'  },
  { left: '14%', width: '7px',  height: '7px',  duration: '12s', delay: '-9s',   drift: '-50px', rotate: '-1turn' },
  { left: '50%', width: '9px',  height: '9px',  duration: '8.5s',delay: '-6s',   drift: '75px',  rotate: '2turn'  },
  { left: '92%', width: '8px',  height: '8px',  duration: '7.5s',delay: '-4.5s', drift: '-35px', rotate: '-1turn' },
];

// ── Componente principal ─────────────────────────────────────────
export function SakuraBackground() {
  return (
    <div className="sakura-bg" aria-hidden="true">
      {/* ── Rama superior-izquierda ──────────────────────────── */}
      <svg
        className="sk-svg sk-svg--tl"
        viewBox="0 0 460 390"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Tronco principal */}
        <path
          className="sk-branch"
          strokeWidth={5}
          d="M 10 110 C 55 50, 125 95, 170 78"
        />
        {/* Rama derecha principal */}
        <path
          className="sk-branch"
          strokeWidth={4.5}
          d="M 170 78 C 215 60, 265 65, 310 52"
        />
        {/* Rama hacia arriba */}
        <path
          className="sk-branch"
          strokeWidth={3.5}
          d="M 265 65 C 272 35, 295 10, 330 18"
        />
        {/* Rama hacia abajo-izquierda */}
        <path
          className="sk-branch"
          strokeWidth={3}
          d="M 170 78 C 160 108, 145 150, 132 175"
        />
        {/* Ramita superior pequeña */}
        <path
          className="sk-branch"
          strokeWidth={2.5}
          d="M 310 52 C 340 40, 375 48, 400 38"
        />
        {/* Ramita inicial */}
        <path
          className="sk-branch"
          strokeWidth={2.5}
          d="M 60 75 C 80 45, 108 38, 130 32"
        />

        {/* Flores en los nodos principales */}
        <CherryFlower x={170} y={78}  size={1.15} opacity={0.80} />
        <CherryFlower x={265} y={65}  size={1.0}  opacity={0.75} />
        <CherryFlower x={132} y={175} size={0.95} opacity={0.70} />
        <CherryFlower x={310} y={52}  size={0.90} opacity={0.72} />
        <CherryFlower x={330} y={18}  size={0.82} opacity={0.65} />
        <CherryFlower x={400} y={38}  size={0.78} opacity={0.60} />
        <CherryFlower x={130} y={32}  size={0.72} opacity={0.55} />
        <CherryFlower x={215} y={63}  size={0.68} opacity={0.50} />
      </svg>

      {/* ── Rama inferior-derecha ────────────────────────────── */}
      <svg
        className="sk-svg sk-svg--br"
        viewBox="0 0 400 320"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Rama desde esquina inferior-derecha */}
        <path
          className="sk-branch"
          strokeWidth={5}
          d="M 390 310 C 345 260, 280 255, 240 265"
        />
        <path
          className="sk-branch"
          strokeWidth={4}
          d="M 240 265 C 200 278, 170 268, 140 278"
        />
        <path
          className="sk-branch"
          strokeWidth={3.5}
          d="M 240 265 C 248 238, 255 205, 260 178"
        />
        <path
          className="sk-branch"
          strokeWidth={3}
          d="M 140 278 C 118 290, 100 278, 82 285"
        />
        <path
          className="sk-branch"
          strokeWidth={2.5}
          d="M 260 178 C 265 152, 260 122, 255 98"
        />
        <path
          className="sk-branch"
          strokeWidth={2.5}
          d="M 310 258 C 325 238, 340 228, 358 222"
        />

        <CherryFlower x={240} y={265} size={1.1}  opacity={0.78} />
        <CherryFlower x={140} y={278} size={0.95} opacity={0.72} />
        <CherryFlower x={260} y={178} size={0.90} opacity={0.70} />
        <CherryFlower x={82}  y={285} size={0.85} opacity={0.65} />
        <CherryFlower x={255} y={98}  size={0.80} opacity={0.62} />
        <CherryFlower x={358} y={222} size={0.75} opacity={0.58} />
        <CherryFlower x={315} y={258} size={0.68} opacity={0.50} />
      </svg>

      {/* ── Pétalos flotantes animados ────────────────────────── */}
      {FALLING_PETALS.map((p, i) => (
        <div
          key={i}
          className="sk-falling-petal"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            '--fall-dur':   p.duration,
            '--fall-delay': p.delay,
            '--fall-drift': p.drift,
            '--fall-rotate':p.rotate,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
