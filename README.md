
# 🌸 Task Manager Pro — Sakura & Glassmorphism Edition

> **Entregable Final · Módulo 4 – Full Stack Development**  
> MateCode Institute · Cohorte 2026

[![Deploy](https://img.shields.io/badge/Deploy-Vercel_Live-success?style=for-the-badge&logo=vercel)](https://proyecto-m4-rociocabral.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![AWS SES](https://img.shields.io/badge/AWS_SES-Serverless_Email-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ses/)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla_%26_HSL_Tokens-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📋 Descripción General

**Task Manager Pro** es una aplicación web SPA de gestión de tareas de nivel producción, desarrollada como entregable final del Módulo 4. La solución implementa un flujo completo de autenticación, persistencia en tiempo real con Cloud Firestore, notificaciones serverless vía AWS SES y una interfaz de usuario con temática Sakura, glassmorphism y soporte de modo claro/oscuro.

- **🌐 Aplicación en Producción:** [https://proyecto-m4-rociocabral.vercel.app](https://proyecto-m4-rociocabral.vercel.app)

- **📦 Repositorio GitHub:** [https://github.com/ROCIOCD/PROYECTO_M4_Rociocabral](https://github.com/ROCIOCD/PROYECTO_M4_Rociocabral)

---

## 🎯 Objetivos del Proyecto y Requerimientos de la Rúbrica

### 1. Clean Architecture y Separación de Responsabilidades

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| **Domain** | Interfaces y tipos de negocio (`Task`, `UserProfile`, `TaskStatus`, `EmailPayload`) | `src/types/index.ts` |
| **Services** | Lógica de acceso a datos Firestore (CRUD + `onSnapshot`) y llamadas API | `src/services/taskService.ts` |
| **Context** | Estado global de autenticación y tema | `src/context/` |
| **Hooks** | Consumo desacoplado de contextos | `src/hooks/` |
| **Pages** | Composición de vistas y orquestación | `src/pages/` |
| **Components** | Unidades visuales reutilizables y fondos temáticos | `src/components/` |
| **Serverless** | Endpoint de notificación transaccional (AWS SES) | `api/notify.ts` |

### 2. SPA Robusta con Enrutamiento Protegido

- Enrutamiento declarativo con `react-router-dom v6` y rutas anidadas.
- Componente `ProtectedRoute` que valida el estado de autenticación antes de renderizar el Dashboard.
- Redirección automática al Login ante sesión inactiva o token revocado.
- Soporte SPA en recargas (prevención de error 404) mediante `vercel.json` con rewrites hacia `/index.html`.

### 3. Persistencia en Base de Datos NoSQL en Tiempo Real

- **Cloud Firestore** como base de datos principal con colección `/tasks/{taskId}`.
- Suscripción reactiva con `onSnapshot` filtrada por `userId` — sincronización en tiempo real entre pestañas y dispositivos.
- Operaciones CRUD completas: creación, lectura reactiva, actualización de estados/campos y eliminación física.
- Reglas de seguridad en Firestore: `allow read, write: if request.auth != null;`

### 4. Control de Versiones Profesional

- Repositorio Git con commits semánticos y descriptivos (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`).
- Historial limpio y trazable.
- `.gitignore` configurado para excluir `.env`, `.env.local`, `node_modules/` y artefactos de compilación (`dist/`).
- Archivo `.env.example` en la raíz documentando todas las variables requeridas sin exponer secretos.

### 5. Despliegue en Entorno Cloud de Producción

- Despliegue continuo en **Vercel** conectado al repositorio de GitHub.
- Variables de entorno aseguradas en el panel de Vercel.
- Función serverless en `api/notify.ts` ejecutada de forma aislada en Vercel Functions.
- Compilación de producción validada con Vite y TypeScript estricto (`tsc --noEmit`) sin advertencias ni errores.

---

## 📧 Flujo de Envío de Emails y Notificaciones

El sistema cuenta con un pipeline desacoplado que garantiza la seguridad de las credenciales cloud:

[Usuario crea una tarea en Dashboard]
│
▼
[Frontend ejecuta petición POST a /api/notify]
│
▼
[Vercel Serverless Function (api/notify.ts)]
├── Valida estructura del payload (título, usuario, estado, fecha límite)
├── Renderiza plantilla HTML Sakura (diseño responsivo, flor animada y datos estructurados)
└── Inicializa cliente SES con credenciales seguras de entorno
│
▼
[AWS Simple Email Service (SES)]
│
▼
[Bandeja de entrada del usuario / Carpeta Spam (Gmail)]


- **Plantilla HTML Temática:** Diseñada específicamente con la estética Sakura de la app, adaptable tanto a clientes de correo web como móviles (Gmail App).
- **Fallback en texto plano:** Envío alternativo en formato texto plano para garantizar accesibilidad en cualquier cliente.

> ⚠️ **Aviso sobre Entorno de Prueba y Carpeta Spam:**  
> Al encontrarse en entorno educativo bajo **AWS SES Sandbox** y utilizar una cuenta `@gmail.com` como remitente sin registros de dominio personalizados (DKIM/SPF dedicados), los servicios de correo (especialmente Gmail) pueden clasificar la notificación entrante dentro de la **carpeta de Spam o Correo no deseado**. Si realizás una prueba de creación de tareas, por favor verificá dicha carpeta.

---

## 🤖 Integración de la Inteligencia Artificial en el Proceso de Desarrollo

El desarrollo de este proyecto se estructuró bajo un modelo de **co-creación Humano–IA en dos niveles complementarios**, combinando la capacidad analítica y conversacional de **Gemini Live Pro** con la capacidad de edición local del agente **AntiGravity**.

### Estrategia de Trabajo: Gemini Live Pro como Puente Lógico y Gestor de Cuota

Para optimizar el uso de tokens y evitar bloqueos por consumo excesivo en el agente de desarrollo (**AntiGravity**), el flujo de trabajo se dividió estratégicamente:
1. **Razonamiento y Clarificación con Gemini Live Pro:** Se utilizó Gemini Live Pro por voz y texto como socio de pensamiento (*thought partner*) para expresar ideas abstractas, definir la lógica de negocio, interpretar errores complejos y redactar especificaciones técnicas precisas.
2. **Generación de Meta-Prompts Eficientes:** Gemini Live Pro redactó prompts sumamente estructurados, concisos y con contexto quirúrgico (archivos exactos, líneas clave y restricciones).
3. **Ejecución Asertiva en AntiGravity:** AntiGravity recibió instrucciones directas y sin ambigüedades, logrando aplicar los cambios en un único pase de ejecución sin iteraciones innecesarias que agotaran la cuota de tokens del IDE.

### Cuadro Descriptivo: Roles, Aplicación Lógica y Resolución de Problemas

| Etapa del Desarrollo | Rol de Gemini Live Pro | Rol de AntiGravity | Resolución Técnica Lograda |
| :--- | :--- | :--- | :--- |
| **1. Ideación y Arquitectura** | *Estructuración conceptual y diseño de prompts* | *N/A (Fase previa de diseño)* | Conversión de ideas en requerimientos funcionales (estética Sakura, flujo BFF con Serverless y AWS SES) y diseño de la estructura limpia de carpetas. |
| **2. Depuración de Rutas y CORS** | *Diagnóstico de causa raíz y análisis de logs* | *Ejecución de cambios en código* | Detección del error 405 y URLs mal formadas en Vercel. Gemini generó el prompt con la corrección exacta y AntiGravity refactorizó `notify.ts` al primer intento. |
| **3. Corrección de Entorno Cloud** | *Saneamiento de variables y validación* | *Alineación de nombres en el frontend* | Resolución de variables de entorno alteradas por extensiones de traducción del navegador, restaurando las claves en inglés (`AWS_ACCESS_KEY_ID`, etc.). |
| **4. Diseño Adaptativo de Emails** | *Ingeniería de maquetación HTML/CSS* | *Incrustación en la función serverless* | Diseño de una tarjeta de correo responsive para la app de Gmail móvil con elementos gráficos florales animados sin romper compatibilidad. |
| **5. Optimización de UX Frontend** | *Diseño de estados de carga y feedback visual* | *Modificación en DashboardPage.tsx* | Implementación de avisos tipo toast y bloqueo de botón ("Guardando y notificando...") para evitar envíos duplicados a AWS SES. |

### Buenas Prácticas y Aprendizajes Obtenidos

* **Ahorro Consciente de Tokens:** El pre-procesamiento conversacional con Gemini Live Pro evitó que el agente del IDE entrara en bucles de prueba y error, reduciendo drásticamente el consumo de tokens en prompts exploratorios.
* **Validación Cruzada en Tres Pasos:** Ninguna sugerencia de la IA se dio por buena sin cumplir: validación en DevTools del navegador $\rightarrow$ compilación estricta con `tsc --noEmit` $\rightarrow$ prueba de envío real con recepción en Gmail.
* **Separación de Responsabilidades (BFF):** Comprensión práctica de por qué servicios cloud como AWS SES deben aislarse en funciones Serverless para no comprometer credenciales en el cliente.

---

## ✨ Características Principales de la Aplicación

### 🗂 Jerarquía Visual y Ordenamiento por Urgencia

Las tareas activas se ordenan automáticamente por fecha y hora límite:

| Badge | Condición | Estilo visual |
|---|---|---|
| 🔴 **Vencida** | `dueDateTime < now` | Rojo pulsante (`animation: pulse-badge`) |
| 🟡 **Vence hoy** | `diffDays === 0` | Ámbar/naranja |
| 🔵 **Vence mañana** | `diffDays === 1` | Azul información |
| 🟣 **En N días** | `diffDays <= 4` | Violeta |

### 📌 Panel Lateral "Tareas Realizadas"

- Panel `aside.done-panel` dedicado en columna izquierda.
- Scroll interno independiente sin alterar la vista activa.
- Acciones rápidas: **Reactivar** (vuelve la tarea a `pending`) o **Eliminar** definitivamente de Firestore.

### 🌸 Temática Sakura & Glassmorphism

- Fondos animados interactivos con pétalos de cerezo flotantes.
- Paleta HSL dinámica con soporte de **Modo Oscuro** y **Modo Claro**, persistiendo la elección en `localStorage`.

---

## ⚙️ Variables de Entorno

El proyecto requiere las siguientes variables de entorno (documentadas en `.env.example`):

| Variable | Descripción | Entorno |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | API Key pública de Firebase | Frontend |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio Auth de Firebase | Frontend |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto en Firebase | Frontend |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento | Frontend |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de mensajería | Frontend |
| `VITE_FIREBASE_APP_ID` | App ID de Firebase | Frontend |
| `VITE_API_BASE_URL` | URL base de la API (`http://localhost:3000` o URL en Vercel) | Frontend |
| `AWS_ACCESS_KEY_ID` | Credencial de acceso IAM para AWS | Vercel Serverless |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta IAM para AWS | Vercel Serverless |
| `AWS_REGION` | Región AWS configurada (`us-east-2`) | Vercel Serverless |
| `AWS_SES_FROM_EMAIL` | Correo remitente verificado en AWS SES | Vercel Serverless |

---

## 🚀 Instalación y Ejecución Local


1. **Clonar el repositorio:**

   ```bash
   git clone [https://github.com/ROCIOCD/PROYECTO_M4_Rociocabral.git](https://github.com/ROCIOCD/PROYECTO_M4_Rociocabral.git)
   cd PROYECTO_M4_Rociocabral


Instalar dependencias:

Bash
npm install
Configurar variables locales:

Bash
cp .env.example .env.local
(Completar los valores reales en .env.local)

Ejecutar en desarrollo:

Bash
npm run dev
Validar tipos y compilar:

Bash
npx tsc --noEmit
npm run build


👩‍💻 Autora

Rocío Cabral

Módulo 4 Full Stack Development · Cohorte 2026


🌸 Hecho con TypeScript estricto, flores de cerezo y mucho café ☕