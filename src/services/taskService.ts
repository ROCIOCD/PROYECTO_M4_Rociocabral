// ─────────────────────────────────────────────────────────────────
// src/services/taskService.ts
// CRUD de tareas sobre Firestore. Todas las operaciones están
// tipadas con las interfaces del dominio (sin `any`).
// La colección raíz es "tasks"; cada documento se filtra por userId
// para garantizar aislamiento de datos entre usuarios.
// ─────────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Task, TaskInput, TaskStatus } from '../types';

// Nombre de la colección en Firestore
const TASKS_COLLECTION = 'tasks';

// ── Helper: mapea un documento Firestore → Task tipada ───────────
function mapDocToTask(id: string, data: DocumentData): Task {
  // Firestore puede devolver Timestamp o number según el contexto
  const toMs = (value: Timestamp | number | null | undefined): number => {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === 'number') return value;
    return Date.now();
  };

  return {
    id,
    title: (data['title'] as string) ?? '',
    description: (data['description'] as string) ?? '',
    status: (data['status'] as TaskStatus) ?? 'pending',
    userId: (data['userId'] as string) ?? '',
    dueDate: (data['dueDate'] as string | undefined) ?? undefined,
    dueTime: (data['dueTime'] as string | undefined) ?? undefined,
    createdAt: toMs(data['createdAt'] as Timestamp | number | null),
    updatedAt: toMs(data['updatedAt'] as Timestamp | number | null),
  };
}

// ── CREATE — Agrega una nueva tarea ──────────────────────────────
export async function createTask(
  userId: string,
  input: TaskInput
): Promise<string> {
  const ref = await addDoc(collection(db, TASKS_COLLECTION), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── READ (realtime) — Escucha tareas del usuario con onSnapshot ──
// Retorna la función `unsubscribe` para limpiar el listener.
export function subscribeToUserTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const tasks: Task[] = snapshot.docs.map((docSnap) =>
        mapDocToTask(docSnap.id, docSnap.data())
      );
      // Ordenar por createdAt descendente (más reciente primero)
      tasks.sort((a, b) => b.createdAt - a.createdAt);
      onChange(tasks);
    },
    (error) => {
      onError?.(error);
    }
  );
}

// ── UPDATE — Actualiza campos parciales de una tarea ─────────────
export async function updateTask(
  taskId: string,
  updates: Partial<TaskInput>
): Promise<void> {
  const ref = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ── UPDATE STATUS — Atajo para cambiar solo el estado ────────────
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  await updateTask(taskId, { status });
}

// ── DELETE — Elimina una tarea por ID ────────────────────────────
export async function deleteTask(taskId: string): Promise<void> {
  const ref = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(ref);
}
