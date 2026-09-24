// ─────────────────────────────────────────────────────────────────
// src/pages/DashboardPage.tsx
// Layout de dos columnas:
//   · Izquierda: panel "Tareas Realizadas" (sticky, glassmorphism)
//   · Derecha:   área de tareas activas ordenadas por fecha ascendente
// Badges de vencimiento: "Vencida", "Vence hoy", "Vence mañana",
//   "En N días" con animación pulsante en las vencidas.
// Todas las operaciones CRUD, autenticación, tema y sakura intactas.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  Plus,
  Trash2,
  LogOut,
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
  X,
  ChevronDown,
  Pencil,
  Sun,
  Moon,
  CalendarDays,
  User,
  ImagePlus,
  Trophy,
  RotateCcw,
  Timer,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  subscribeToUserTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../services/taskService';
import type { Task, TaskInput, TaskStatus, EmailPayload, ProfileUpdate } from '../types';
import { DashboardSakura } from '../components/DashboardSakura';

// ── Constantes de UI ──────────────────────────────────────────────
const STATUS_LABELS: Record<TaskStatus, string> = {
  'pending': 'Pendiente',
  'in-progress': 'En progreso',
  'done': 'Completada',
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  'pending': <Circle size={16} />,
  'in-progress': <Clock size={16} />,
  'done': <CheckCircle2 size={16} />,
};

//const _TODAY = new Date().toISOString().split('T')[0];

// ── Avatares predeterminados ──────────────────────────────────────
const PRESET_AVATARS = [
  { id: 'sakura', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sakura&backgroundColor=fce4ec', label: 'Sakura' },
  { id: 'hana', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hana&backgroundColor=f8bbd0', label: 'Hana' },
  { id: 'yuki', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Yuki&backgroundColor=e8eaf6', label: 'Yuki' },
  { id: 'luna', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=ede7f6', label: 'Luna' },
  { id: 'momo', url: 'https://api.dicebear.com/9.x/big-smile/svg?seed=Momo&backgroundColor=fce4ec', label: 'Momo' },
  { id: 'kana', url: 'https://api.dicebear.com/9.x/big-smile/svg?seed=Kana&backgroundColor=e0f7fa', label: 'Kana' },
] as const;

// ── Helpers de fecha y vencimiento ───────────────────────────────

/** Clave numérica para ordenar: ms hasta el deadline. Sin fecha → +∞ */
function taskSortKey(task: Task): number {
  if (!task.dueDate) return Infinity;
  return new Date(`${task.dueDate}T${task.dueTime ?? '23:59:59'}`).getTime();
}

type DueSeverity = 'overdue' | 'today' | 'tomorrow' | 'soon' | null;

interface DueInfo { label: string; severity: DueSeverity; }

/** Devuelve el badge de urgencia para tareas activas con fecha */
function getDueInfo(task: Task): DueInfo | null {
  if (!task.dueDate || task.status === 'done') return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateTime = new Date(`${task.dueDate}T${task.dueTime ?? '23:59:59'}`);
  const dueDayStart = new Date(`${task.dueDate}T00:00:00`);
  const diffDays = Math.floor(
    (dueDayStart.getTime() - todayStart.getTime()) / 86_400_000
  );

  if (dueDateTime < now) return { label: 'Vencida', severity: 'overdue' };
  if (diffDays === 0) return { label: 'Vence hoy', severity: 'today' };
  if (diffDays === 1) return { label: 'Vence mañana', severity: 'tomorrow' };
  if (diffDays <= 4) return { label: `En ${diffDays} días`, severity: 'soon' };
  return null;
}

/** Formatea dueDate a DD/MM/YYYY (hora incluida si existe) */
function formatDate(task: Task): string | null {
  if (!task.dueDate) return null;
  const d = new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  return task.dueTime ? `${d} ${task.dueTime}` : d;
}

// ── Utilidad: resize de imagen → data URL ─────────────────────────
function resizeImageToDataURL(file: File): Promise<string> {
  const MAX = 220;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida.'));
      img.onload = () => {
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas no soportado.')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string | null>(null);

  // ── Formulario NUEVA tarea ────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('pending');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Modal EDICIÓN de tarea ────────────────────────────────────
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('pending');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ── Modal PERFIL ──────────────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhotoURL, setProfilePhotoURL] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Suscripción Firestore — dep [user?.uid] ───────────────────
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setTasks([]);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToUserTasks(
      user.uid,
      (updatedTasks) => { setTasks(updatedTasks); setIsLoading(false); },
      (err) => { setError('Error al cargar: ' + err.message); setIsLoading(false); }
    );
    return unsubscribe;
  }, [user?.uid]);

  // ── Derivados: split + ordenamiento ──────────────────────────
  // Activas: pending + in-progress, ordenadas fecha ASC (sin fecha al final)
  const activeTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => taskSortKey(a) - taskSortKey(b));

  // Realizadas: completadas, ordenadas por updatedAt DESC (más reciente arriba)
  const doneTasks = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // ── Stats ─────────────────────────────────────────────────────
  const stats = {
    total: tasks.length,
    done: doneTasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
  };

  const avatarLetter = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase();

  // ── Handlers ──────────────────────────────────────────────────
  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ?? '');
    setEditDueTime(task.dueTime ?? '');
  }
  const handleCloseEdit = () => setEditingTask(null);

  function handleOpenProfile() {
    setProfileName(user?.displayName ?? '');
    setProfilePhotoURL(user?.photoURL ?? '');
    setShowProfile(true);
  }

  async function handleCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !formTitle.trim()) return;
    setIsSubmitting(true);
    const input: TaskInput = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      status: formStatus,
      dueDate: formDueDate || undefined,
      dueTime: formDueTime || undefined,
    };
    try {
      await createTask(user.uid, input);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL as string;
        // ⚠️ SES Sandbox: solo se pueden enviar emails a direcciones verificadas.
        // Mientras la cuenta esté en Sandbox, forzamos el destinatario al email verificado.
        const sandboxTo = 'rociocabral27@gmail.com';
        await fetch(`${apiBase}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: sandboxTo,
            subject: `🌸 Nueva tarea: ${input.title}`,
            taskTitle:  input.title,
            taskStatus: input.status,
            taskDate:   input.dueDate  ?? undefined,
            taskTime:   input.dueTime  ?? undefined,
            taskUser:   user.email ?? 'desconocido',
          } satisfies EmailPayload),
        });
      } catch (notifyErr) { console.warn('[notify]', notifyErr); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la tarea.');
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  }

  async function handleSaveEdit() {
    if (!editingTask || !editTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
        dueDate: editDueDate || undefined,
        dueTime: editDueTime || undefined,
      });
      handleCloseEdit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar.');
    } finally { setIsSavingEdit(false); }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProfilePhotoURL(await resizeImageToDataURL(file));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la imagen.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    try {
      await updateProfile({ displayName: profileName, photoURL: profilePhotoURL } satisfies ProfileUpdate);
      setShowProfile(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil.');
    } finally { setIsSavingProfile(false); }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try { await updateTaskStatus(taskId, status); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al cambiar estado.'); }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    try { await deleteTask(taskId); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al eliminar.'); }
  }

  async function handleLogout() {
    try { await logout(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al cerrar sesión.'); }
  }

  function resetForm() {
    setFormTitle(''); setFormDescription(''); setFormStatus('pending');
    setFormDueDate(''); setFormDueTime(''); setShowForm(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* Capa sakura de fondo — ramas fijas + 6 pétalos lentos */}
      <DashboardSakura />

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-top">
            <ClipboardList size={20} />
            <span>MateCode Tasks</span>
          </div>
          <div className="navbar-theme-row">
            <button id="theme-toggle-btn" className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              style={{ width: '28px', height: '28px' }}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <span className="navbar-theme-label">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
          </div>
        </div>

        <div className="navbar-user">
          <button id="profile-trigger-btn" className="profile-trigger"
            onClick={handleOpenProfile} aria-label="Editar perfil" title="Editar perfil">
            {user?.photoURL
              ? <img src={user.photoURL} alt={user.displayName ?? user.email} className="profile-avatar" />
              : <div className="profile-avatar-placeholder" aria-hidden="true">{avatarLetter}</div>}
            <span className="navbar-email">{user?.displayName ?? user?.email}</span>
          </button>
          <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={16} /><span>Salir</span>
          </button>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="dashboard-main">
        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar error"><X size={14} /></button>
          </div>
        )}

        {/* Stats — ancho completo */}
        <section className="stats-grid" aria-label="Resumen de tareas">
          <StatCard label="Total" value={stats.total} color="blue" />
          <StatCard label="Pendientes" value={stats.pending} color="yellow" />
          <StatCard label="En progreso" value={stats.inProgress} color="purple" />
          <StatCard label="Completadas" value={stats.done} color="green" />
        </section>

        {/* ── Layout dos columnas ───────────────────────────── */}
        <div className="dashboard-columns">

          {/* ─ Panel izquierdo: Tareas Realizadas ────────────── */}
          <aside className="done-panel" aria-label="Tareas realizadas">
            <header className="done-panel-header">
              <Trophy size={15} />
              <span className="done-panel-title">Tareas Realizadas</span>
              <span className="done-count-badge">{doneTasks.length}</span>
            </header>

            {doneTasks.length === 0 ? (
              <p className="done-empty-msg">
                Completá tareas para verlas aquí. ✨
              </p>
            ) : (
              <ul className="done-list" aria-label="Lista de tareas completadas">
                {doneTasks.map((task) => (
                  <DoneTaskItem
                    key={task.id}
                    task={task}
                    onReactivate={() => handleStatusChange(task.id, 'pending')}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </ul>
            )}
          </aside>

          {/* ─ Área derecha: Tareas Activas ──────────────────── */}
          <section className="active-tasks-area">
            <div className="section-header">
              <h2 className="section-title">Mis Tareas</h2>
              <button id="new-task-btn" className="btn btn-primary"
                onClick={() => setShowForm((p) => !p)} aria-expanded={showForm}>
                {showForm ? <X size={16} /> : <Plus size={16} />}
                {showForm ? 'Cancelar' : 'Nueva tarea'}
              </button>
            </div>

            {/* Formulario nueva tarea */}
            {showForm && (
              <form id="new-task-form" onSubmit={handleCreateTask}
                className="task-form card" aria-label="Formulario de nueva tarea">
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="task-title" className="form-label">Título *</label>
                    <input id="task-title" type="text" className="form-input"
                      value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Nombre de la tarea" required autoFocus />
                  </div>
                  <div className="form-field form-field--sm">
                    <label htmlFor="task-status" className="form-label">Estado</label>
                    <div className="form-select-wrapper">
                      <select id="task-status" className="form-select"
                        value={formStatus} onChange={(e) => setFormStatus(e.target.value as TaskStatus)}>
                        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="select-icon" />
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="task-description" className="form-label">Descripción</label>
                  <textarea id="task-description" className="form-input form-textarea"
                    value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción opcional..." rows={3} />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="task-due-date" className="form-label">Fecha límite</label>
                    <input id="task-due-date" type="date" className="form-input"
                      value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)}
                      min="2026-01-01" />
                  </div>
                  <div className="form-field form-field--sm">
                    <label htmlFor="task-due-time" className="form-label">Hora</label>
                    <input id="task-due-time" type="time" className="form-input"
                      value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
                  <button id="create-task-submit" type="submit" className="btn btn-primary"
                    disabled={isSubmitting || !formTitle.trim()}>
                    {isSubmitting
                      ? <><span className="btn-spinner" aria-hidden="true" /> Guardando...</>
                      : 'Guardar tarea'}
                  </button>
                </div>
              </form>
            )}

            {/* Lista de tareas activas */}
            {isLoading ? (
              <div className="tasks-loading" role="status">
                <div className="loading-spinner" />
                <span>Cargando tareas...</span>
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="tasks-empty">
                <ClipboardList size={44} className="tasks-empty-icon" />
                <p>No hay tareas activas.</p>
                <p className="tasks-empty-sub">
                  {doneTasks.length > 0
                    ? '¡Todas tus tareas están completadas! 🎉'
                    : 'Hacé clic en "Nueva tarea" para empezar.'}
                </p>
              </div>
            ) : (
              <ul className="tasks-list" aria-label="Lista de tareas activas">
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task}
                    onEdit={handleOpenEdit}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {/* ── Modal edición de tarea ─────────────────────────── */}
      {editingTask && (
        <div className="modal-overlay" role="dialog" aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseEdit(); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 id="edit-modal-title" className="modal-title">Editar tarea</h2>
              <button className="modal-close" onClick={handleCloseEdit} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="form-field">
              <label htmlFor="edit-title" className="form-label">Título *</label>
              <input id="edit-title" type="text" className="form-input"
                value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
            </div>
            <div className="form-field">
              <label htmlFor="edit-description" className="form-label">Descripción</label>
              <textarea id="edit-description" className="form-input form-textarea"
                value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="form-field">
              <label htmlFor="edit-status" className="form-label">Estado</label>
              <div className="form-select-wrapper">
                <select id="edit-status" className="form-select"
                  value={editStatus} onChange={(e) => setEditStatus(e.target.value as TaskStatus)}>
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-icon" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="edit-due-date" className="form-label">Fecha límite</label>
                <input id="edit-due-date" type="date" className="form-input"
                  value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} min="2026-01-01" />
              </div>
              <div className="form-field form-field--sm">
                <label htmlFor="edit-due-time" className="form-label">Hora</label>
                <input id="edit-due-time" type="time" className="form-input"
                  value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={handleCloseEdit}>Cancelar</button>
              <button id="save-edit-btn" className="btn btn-primary"
                onClick={handleSaveEdit} disabled={isSavingEdit || !editTitle.trim()}>
                {isSavingEdit
                  ? <><span className="btn-spinner" aria-hidden="true" /> Guardando...</>
                  : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de perfil ───────────────────────────────── */}
      {showProfile && (
        <div className="modal-overlay" role="dialog" aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}>
          <div className="modal modal--profile">
            <div className="modal-header">
              <h2 id="profile-modal-title" className="modal-title">Mi perfil</h2>
              <button className="modal-close" onClick={() => setShowProfile(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="profile-avatar-preview">
              {profilePhotoURL
                ? <img src={profilePhotoURL} alt="Vista previa" className="profile-avatar-lg"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : <div className="profile-avatar-lg-placeholder" aria-hidden="true">{avatarLetter}</div>}
              <span className="profile-email-badge">{user?.email}</span>
            </div>

            <div className="form-field">
              <label htmlFor="profile-name" className="form-label">Nombre visible / alias</label>
              <div className="form-input-wrapper">
                <User size={16} className="form-input-icon" />
                <input id="profile-name" type="text" className="form-input"
                  value={profileName} onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre o alias" autoFocus />
              </div>
            </div>

            <div>
              <p className="modal-section-label">Foto desde tu dispositivo</p>
              <div className="file-upload-area">
                <input ref={fileInputRef} id="profile-file-input" type="file"
                  accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="file-upload-btn"
                  onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={15} />Elegir foto
                </button>
                <span className="file-upload-hint">JPG, PNG o WebP · se comprime a 220 px</span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="profile-photo" className="form-label">O pegá una URL de imagen</label>
              <input id="profile-photo" type="url" className="form-input"
                value={profilePhotoURL} onChange={(e) => setProfilePhotoURL(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg" />
            </div>

            <div>
              <p className="modal-section-label">Avatares predeterminados</p>
              <div className="avatar-gallery" role="listbox" aria-label="Galería de avatares">
                {PRESET_AVATARS.map((av) => (
                  <button key={av.id} type="button" role="option"
                    className={`avatar-option${profilePhotoURL === av.url ? ' avatar-option--selected' : ''}`}
                    onClick={() => setProfilePhotoURL(av.url)}
                    title={av.label} aria-label={`Seleccionar ${av.label}`}
                    aria-selected={profilePhotoURL === av.url}>
                    <img src={av.url} alt={av.label} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowProfile(false)}>Cancelar</button>
              <button id="save-profile-btn" className="btn btn-primary"
                onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile
                  ? <><span className="btn-spinner" aria-hidden="true" /> Guardando...</>
                  : 'Guardar perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de tarea activa
// ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function TaskCard({ task, onEdit, onStatusChange, onDelete }: TaskCardProps) {
  const due = getDueInfo(task);
  const dateLabel = formatDate(task);

  return (
    <li className={`task-card task-card--${task.status}`}>
      <div className="task-status-badge" title={STATUS_LABELS[task.status]}>
        {STATUS_ICONS[task.status]}
      </div>

      <div className="task-content">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-description">{task.description}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span className={`task-status-label task-status-label--${task.status}`}>
            {STATUS_LABELS[task.status]}
          </span>

          {/* Badge de urgencia */}
          {due && (
            <span className={`due-badge due-badge--${due.severity}`}>
              <Timer size={9} />
              {due.label}
            </span>
          )}

          {/* Fecha/hora */}
          {dateLabel && (
            <span className="task-due-date" title="Fecha límite">
              <CalendarDays size={10} />
              {dateLabel}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <div className="form-select-wrapper form-select-wrapper--sm">
          <select className="form-select form-select--sm" value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            aria-label={`Estado de: ${task.title}`}>
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <ChevronDown size={12} className="select-icon" />
        </div>
        <button className="btn btn-ghost btn-icon btn-sm"
          onClick={() => onEdit(task)} aria-label={`Editar: ${task.title}`} title="Editar">
          <Pencil size={15} />
        </button>
        <button className="btn btn-danger btn-icon btn-sm"
          onClick={() => onDelete(task.id)} aria-label={`Eliminar: ${task.title}`} title="Eliminar">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componente: ítem de tarea realizada (panel izquierdo)
// ─────────────────────────────────────────────────────────────────
interface DoneTaskItemProps {
  task: Task;
  onReactivate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

function DoneTaskItem({ task, onReactivate, onDelete }: DoneTaskItemProps) {
  const dateLabel = formatDate(task);
  return (
    <li className="done-task-item">
      <div className="done-task-content">
        <span className="done-task-title" title={task.title}>{task.title}</span>
        {dateLabel && <span className="done-task-date"><CalendarDays size={9} style={{ display: 'inline', marginRight: 3 }} />{dateLabel}</span>}
      </div>
      <div className="done-task-actions">
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onReactivate}
          aria-label={`Reactivar: ${task.title}`}
          title="Reactivar tarea"
        >
          <RotateCcw size={13} />
        </button>
        <button
          className="btn btn-danger btn-icon btn-sm"
          onClick={onDelete}
          aria-label={`Eliminar: ${task.title}`}
          title="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de estadística
// ─────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: number; color: 'blue' | 'yellow' | 'purple' | 'green'; }
function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
