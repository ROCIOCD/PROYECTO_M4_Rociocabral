
powershell -Command @"
Set-Content -Path 'README.md' -Encoding UTF8 -Value @'
# 🌸 Task Manager Pro — Sakura & Glassmorphism Edition

> **Entregable Final · Módulo 4 – Full Stack Development**
> MateCode Institute · Cohorte 2026

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![AWS SES](https://img.shields.io/badge/AWS_SES-Serverless_Email-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ses/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla_%26_HSL_Tokens-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📋 Descripción General

**Task Manager Pro** es una aplicación web de gestión de tareas de nivel producción, desarrollada como entregable final del Módulo 4 de MateCode. La aplicación implementa un flujo completo de autenticación, persistencia en tiempo real con Cloud Firestore, notificaciones serverless vía AWS SES y una interfaz premium con temática Sakura, glassmorphism y soporte de modo claro/oscuro.

El proyecto demuestra la aplicación integrada de **Clean Architecture**, **TypeScript estricto**, **SPA routing protegido** y **despliegue cloud** con buenas prácticas de ingeniería de software y metodología de co-creación Humano–IA.

---

## 🎯 Objetivos del Proyecto y Requerimientos de la Rúbrica

### 1. Clean Architecture y Separación de Responsabilidades

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| **Domain** | Interfaces y tipos de negocio (`Task`, `UserProfile`, `TaskStatus`) | `src/types/index.ts` |
| **Services** | Lógica de acceso a datos Firestore (CRUD + `onSnapshot`) | `src/services/taskService.ts` |
| **Context** | Estado global de autenticación y tema | `src/context/` |
| **Hooks** | Consumo desacoplado de contextos | `src/hooks/` |
| **Pages** | Composición de vistas y orquestación | `src/pages/` |
| **Components** | Unidades visuales reutilizables | `src/components/` |
| **Serverless** | Endpoint de notificación (AWS SES) | `api/notify.ts` |

### 2. SPA Robusta con Enrutamiento Protegido

- Enrutamiento declarativo con `react-router-dom v6` y rutas anidadas.
- Componente `ProtectedRoute` que valida el estado de autenticación antes de renderizar el Dashboard.
- Redirección automática al Login ante sesión inactiva o token vencido.
- Resolución de recarga de página (SPA 404) mediante `vercel.json` con rewrites hacia `/index.html`.

### 3. Persistencia en Base de Datos NoSQL en Tiempo Real

- **Cloud Firestore** como base de datos principal con colección `/tasks/{taskId}`.
- Suscripción reactiva con `onSnapshot` filtrada por `userId` — las tareas se sincronizan en tiempo real entre pestañas y dispositivos.
- Operaciones CRUD completas: crear, leer (en tiempo real), actualizar estado/campos y eliminar.
- Reglas de seguridad Firestore: `allow read, write: if request.auth != null;`

### 4. Control de Versiones Profesional

- Repositorio Git con commits semánticos (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`).
- Estrategia de ramas: `main` (producción estable) · `develop` (integración) · `feature/*` (funcionalidades).
- `.gitignore` configurado para excluir `node_modules/`, `.env.local`, `.env`, `dist/` y archivos de IDE.

### 5. Despliegue en Entorno Cloud de Producción

- Despliegue continuo en **Vercel** conectado al repositorio de GitHub.
- Variables de entorno configuradas en el panel de Vercel (nunca expuestas en código).
- Función serverless en `api/notify.ts` ejecutada en el runtime de Vercel Edge/Node.
- Build de producción validado con `npm run build` y `tsc --noEmit` sin errores.

---

## 🤝 Metodología de Trabajo y Co-Creación Humano–IA

Este proyecto fue desarrollado bajo un paradigma de **co-creación Humano–IA** en tres fases iterativas:

### Fase 1 — Ideación y Diseño Conceptual (Gemini Live / Voz)

Las sesiones conversacionales por voz con **Gemini Live** fueron utilizadas para:

- Definir el alcance funcional y la arquitectura del sistema antes de escribir una sola línea de código.
- Co-diseñar el flujo de usuario: onboarding → autenticación → dashboard → CRUD → notificación.
- Establecer la paleta de colores HSL, el sistema de tokens de diseño y la estética Sakura/Glassmorphism.
- Formular los **meta-prompts estratégicos** que luego se trasladaron al IDE, optimizados para maximizar la efectividad de cada interacción y respetar la cuota de tokens disponible.

> **Principio aplicado:** Separar el *qué* (voz/ideación) del *cómo* (código/implementación). La IA actúa como par técnico senior, no como reemplazante del criterio humano.

### Fase 2 — Auditoría Técnica y Formulación de Meta-Prompts

Entre sesiones se realizó un ciclo de auditoría que incluía:

1. **Inspección de la consola del navegador** — identificación de errores TypeScript, warnings de React y fallos de red.
2. **Revisión de logs de Vercel** — trazabilidad de errores en funciones serverless.
3. **Formulación de prompts de corrección** — cada bug se documentó con contexto (archivo, línea, causa raíz) para generar instrucciones precisas y eficientes en tokens.
4. **Validación post-corrección** — `npx tsc --noEmit` como gate de calidad obligatorio antes de cada commit.

### Fase 3 — Ejecución en el IDE (Agente Antigravity)

El agente **Antigravity IDE** ejecutó las refactorizaciones en el entorno de desarrollo local:

- Ediciones atómicas sobre `DashboardPage.tsx`, `index.css`, `taskService.ts` y `api/notify.ts` con validación TypeScript estricto (`strict: true`).
- Cada cambio fue verificado con `tsc --noEmit` (exit code 0) antes de considerarse exitoso.
- Hot Module Replacement (HMR) de Vite permitió validar el resultado visual de forma inmediata.

---

## ✨ Características Principales

### 🗂 Jerarquía Visual y Ordenamiento por Urgencia

Las tareas activas (pendientes e in-progress) se ordenan **ascendentemente por fecha y hora límite**.

| Badge | Condición | Estilo visual |
|---|---|---|
| 🔴 **Vencida** | `dueDateTime < now` | Rojo pulsante (`animation: pulse-badge`) |
| 🟡 **Vence hoy** | `diffDays === 0` | Ámbar/naranja |
| 🔵 **Vence mañana** | `diffDays === 1` | Azul información |
| 🟣 **En N días** | `diffDays <= 4` | Violeta |

- Tareas **sin fecha asignada** se posicionan al final (`Infinity` como clave de ordenamiento).
- Las tareas completadas se desplazan automáticamente al **Panel de Tareas Realizadas**.

### 📌 Panel Lateral "Tareas Realizadas"

- `aside.done-panel` en columna izquierda del layout de dos columnas.
- Scroll interno independiente (`overflow-y: auto`) sin afectar la columna activa.
- **Sticky positioning** respetando la navbar (`top: 84px`).
- Alineación vertical precisa: `margin-top: 60px` (= section-header ~44px + gap 16px).
- **Reactivar** (`RotateCcw`) — devuelve al estado `pending` vía `updateTaskStatus`.
- **Eliminar** (`Trash2`) — eliminación permanente de Firestore con confirmación.
- Responsive: `< 768px` → panel apilado debajo del área activa (`order: 2`).

### 🌸 UI/UX — Temática Sakura & Glassmorphism

| Elemento | Dark | Light |
|---|---|---|
| Navbar | `hsla(224,18%,12%,0.82)` + blur(16px) | `hsla(0,0%,100%,0.82)` + blur(16px) |
| Stat Cards | `hsla(224,18%,14%,0.75)` + blur(10px) | `hsla(0,0%,100%,0.80)` + borde rosa |
| Task Cards | `hsla(224,18%,14%,0.78)` + blur(10px) | `hsla(0,0%,100%,0.82)` + borde rosa |
| Done Panel | `hsla(142,25%,11%,0.72)` + blur(10px) | `hsla(142,30%,97%,0.84)` + borde verde |

- Componente `SakuraBackground` (Auth): 2 árboles SVG + 10 pétalos animados con `@keyframes sk-fall`.
- Componente `DashboardSakura` (Dashboard): 4 ramas en esquinas (`position: fixed, z-index: 0`) + 6 pétalos lentos (16–22s).
- Tokens HSL en `:root` (dark) sobrescritos por `[data-theme="light"]`. Preferencia persistida en `localStorage`.

### 🔐 Autenticación y Perfil

- Firebase Auth con Email/Password: registro, login, logout, persistencia de sesión.
- Interfaz `UserProfile` desacoplada de `FirebaseUser` — mapeada en `onAuthStateChanged`.
- Modal de perfil: edición de alias, foto local (canvas resize 220px JPEG 85%), galería DiceBear v9 (6 avatares), URL manual.

### 📧 Backend Serverless — Notificaciones AWS SES

- `api/notify.ts`: acepta `EmailPayload { to, subject, body }`, usa `SESClient + SendEmailCommand`.
- Fallo silencioso en local (try/catch secundario) — no bloquea el CRUD.
- Variables requeridas: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_FROM_EMAIL`.

---

## 🐛 Bitácora de Desafíos Técnicos y Soluciones

| # | Síntoma | Causa Raíz | Solución |
|---|---|---|---|
| 1 | **Error 404** al recargar rutas SPA en Vercel | Vercel busca archivo físico inexistente | `vercel.json` con rewrites: toda ruta → `/index.html` |
| 2 | **TS2834** en `api/notify.ts` | Discrepancia tipos SDK v3 AWS | Interfaz `EmailPayload` inline + operador `satisfies` |
| 3 | **"Guardando..." congelado** en Firestore | Reglas de seguridad bloqueaban escrituras | `allow read, write: if request.auth != null;` + bloque `finally` |
| 4 | **TS6133** variable `TODAY` no usada | Refactor eliminó el uso pero no la declaración | Limpieza de código; lógica de fecha inline en `getDueInfo()` |
| 5 | **"Cargando tareas..." indefinido** | `useEffect` con dep `[user]` → re-suscripción infinita en cada token refresh | Dep cambiada a `[user?.uid]` (primitivo string) |
| 6 | **Panel izquierdo desalineado** verticalmente | Panel iniciaba en top del grid cell, no debajo del section-header | `margin-top: 60px` en `.done-panel` |
| 7 | **Márgenes excesivos** en desktop 1440px | `max-width: 1120px` fijo dejaba >160px de margen | `max-width: min(1280px, 95vw)` + `clamp(280px, 24%, 320px)` |

---

## 🏗 Estructura del Proyecto (Clean Architecture)

```text
PROYECTO_M4_Rociocabral/
│
├── api/                          # Backend Serverless (Vercel Functions)
│   └── notify.ts                 # Endpoint POST /api/notify → AWS SES
│
├── public/                       # Assets estáticos
│
├── src/
│   ├── components/               # Componentes visuales reutilizables
│   │   ├── SakuraBackground.tsx  # Fondo Sakura Auth (SVG + pétalos animados)
│   │   └── DashboardSakura.tsx   # Fondo Sakura Dashboard (4 esquinas, sutil)
│   │
│   ├── context/                  # Estado global (React Context API)
│   │   ├── AuthContext.tsx       # Proveedor de autenticación Firebase
│   │   └── ThemeContext.tsx      # Proveedor de modo claro/oscuro
│   │
│   ├── hooks/                    # Custom hooks para consumo de contextos
│   │   ├── useAuth.ts            # Acceso tipado a AuthContext
│   │   └── useTheme.ts           # Acceso tipado a ThemeContext
│   │
│   ├── pages/                    # Vistas / páginas de la SPA
│   │   ├── DashboardPage.tsx     # Vista principal — CRUD + layout dos columnas
│   │   ├── LoginPage.tsx         # Formulario de inicio de sesión
│   │   ├── RegisterPage.tsx      # Formulario de registro
│   │   └── NotFoundPage.tsx      # Página 404
│   │
│   ├── services/                 # Capa de acceso a datos (Firestore)
│   │   └── taskService.ts        # CRUD + suscripción onSnapshot tipada
│   │
│   ├── types/                    # Tipos e interfaces del dominio
│   │   └── index.ts              # Task, UserProfile, TaskStatus, EmailPayload, ProfileUpdate
│   │
│   ├── App.tsx                   # Router + ProtectedRoute + Providers
│   ├── main.tsx                  # Entry point de React
│   └── index.css                 # Sistema de diseño HSL + Glassmorphism + Sakura CSS
│
├── .env.example                  # Plantilla de variables de entorno
├── .env.local                    # Variables locales (excluido del repositorio)
├── .gitignore                    # Exclusiones de control de versiones
├── vercel.json                   # Rewrites SPA + routing serverless
├── tsconfig.app.json             # TypeScript strict: true
├── vite.config.ts                # Configuración del bundler
└── package.json                  # Dependencias y scripts
```

---

## ⚙️ Instalación, Configuración y Despliegue

### Prerrequisitos

- **Node.js** >= 18.x, **npm** >= 9.x
- Proyecto **Firebase** con Auth (Email/Password) y Firestore habilitados
- Cuenta **AWS** con identidad verificada en SES (para notificaciones)
- Cuenta **Vercel**

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/PROYECTO_M4_Rociocabral.git
cd PROYECTO_M4_Rociocabral
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_BASE_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
SES_FROM_EMAIL=no-reply@tu-dominio.com
```

### 3. Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Ejecutar en local

```bash
npm run dev         # http://localhost:5173
vercel dev          # funciones serverless en http://localhost:3000
```

### 5. Validar y hacer build

```bash
npx tsc --noEmit    # debe retornar exit code 0
npm run build
```

### 6. Deploy en Vercel

Importar el repositorio en [vercel.com/new](https://vercel.com/new), configurar las variables de entorno en **Settings → Environment Variables** y hacer push a `main`.

---

## 📦 Stack de Dependencias

| Paquete | Versión | Propósito |
|---|---|---|
| `react` / `react-dom` | ^18.x | UI + Renderer |
| `react-router-dom` | ^6.x | Enrutamiento SPA |
| `firebase` | ^10.x | Auth + Firestore |
| `@aws-sdk/client-ses` | ^3.x | Cliente AWS SES |
| `lucide-react` | ^0.x | Iconografía SVG |
| `vite` | ^6.x | Bundler + Dev Server |
| `typescript` | ^5.x | Tipado estricto |
| `vitest` | ^2.x | Testing unitario |
| `@testing-library/react` | ^16.x | Testing de componentes |

## 📄 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Preview del build local |
| `npm run lint` | Análisis estático con ESLint |
| `npx tsc --noEmit` | Validación de tipos TypeScript |

## 🔒 Seguridad

- Variables de entorno separadas por contexto (`VITE_*` cliente / sin prefijo servidor).
- `.env.local` excluido del repositorio vía `.gitignore`.
- Reglas Firestore: solo usuarios autenticados.
- TypeScript `strict: true` — sin `any` implícito.

---

## 👩‍💻 Autora

**Rocío Cabral**
Estudiante — Módulo 4 Full Stack · MateCode Institute · Cohorte 2026

---

## 📝 Licencia

Desarrollado con fines educativos en el marco del programa MateCode.
Distribuido bajo licencia **MIT**.

---

<div align="center">

**🌸 Hecho con TypeScript estricto, flores de cerezo y mucho café ☕**

</div>
'@
"@