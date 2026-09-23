// ─────────────────────────────────────────────────────────────────
// src/types/index.ts
// Única fuente de verdad del dominio. Ninguna otra capa define
// tipos ad-hoc — todo el tipado de negocio vive aquí.
// ─────────────────────────────────────────────────────────────────

// ── Enum de estados de tarea ──────────────────────────────────────
export type TaskStatus = 'pending' | 'in-progress' | 'done';

// ── Entidad Task (leída de Firestore) ────────────────────────────
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId: string;
  dueDate?: string;    // Fecha límite — ISO date string (YYYY-MM-DD), opcional
  dueTime?: string;    // Hora límite — HH:MM (24h), opcional
  createdAt: number;   // Unix timestamp (ms)
  updatedAt: number;   // Unix timestamp (ms)
}

// ── DTO de entrada para crear/actualizar una tarea ───────────────
// Excluye campos autogenerados (id, userId, timestamps)
export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;    // Fecha límite opcional (YYYY-MM-DD)
  dueTime?: string;    // Hora límite opcional (HH:MM)
}

// ── Perfil de usuario autenticado ────────────────────────────────
// Mapeado desde FirebaseUser — desacopla el dominio de Firebase
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;    // URL de la foto de perfil
}

// ── DTO de actualización de perfil ──────────────────────────────
export interface ProfileUpdate {
  displayName: string;
  photoURL: string;
}

// ── Payload para la Serverless Function de notificación ──────────
export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

// ── Wrapper genérico para respuestas de la API ───────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ── Forma del contexto de autenticación ─────────────────────────
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<void>;
}

// ── Tema de la interfaz ───────────────────────────────────────────
export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
