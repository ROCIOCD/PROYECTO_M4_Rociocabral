// ─────────────────────────────────────────────────────────────────
// src/pages/DashboardPage.tsx
// Mejoras de esta versión:
//   · Fix carga inmediata: dep [user?.uid] evita re-suscripciones
//     innecesarias por cambio de referencia del objeto user
//   · isLoading=false apenas llega el primer snapshot (incluso vacío)
//   · Perfil: subida de foto local (FileReader+canvas resize a 200px)
//     + galería de 6 avatares predeterminados (DiceBear kawaii)
//   · Theme toggle debajo del logo (izquierda navbar)
//   · Campo dueTime (hora límite) en creación y edición
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

const TODAY = new Date().toISOString().split('T')[0];

// ── Avatares predeterminados (DiceBear kawaii / adventurer) ───────
const PRESET_AVATARS = [
  { id: 'sakura', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sakura&backgroundColor=fce4ec', label: 'Sakura' },
  { id: 'hana',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hana&backgroundColor=f8bbd0',   label: 'Hana'   },
  { id: 'yuki',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Yuki&backgroundColor=e8eaf6',   label: 'Yuki'   },
  { id: 'luna',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundColor=ede7f6',   label: 'Luna'   },
  { id: 'momo',   url: 'https://api.dicebear.com/9.x/big-smile/svg?seed=Momo&backgroundColor=fce4ec',    label: 'Momo'   },
  { id: 'kana',   url: 'https://api.dicebear.com/9.x/big-smile/svg?seed=Kana&backgroundColor=e0f7fa',    label: 'Kana'   },
] as const;

// ── Utilidad: redimensionar imagen y convertir a data URL ─────────
// Máx 220×220 px, JPEG 85 % — para mantener el campo photoURL liviano
function resizeImageToDataURL(file: File): Promise<string> {
  const MAX = 220;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida.'));
      img.onload = () => {
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas no soportado.')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// ── Componente principal ─────────────────────────────────────────
export function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  // LOADING FIX: empieza en true solo si hay un usuario; si no, false.
  // Se resetea a true explícitamente al re-suscribir con nuevo uid.
  const [isLoading, setIsLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string | null>(null);

  // ── Estado formulario NUEVA tarea ────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('pending');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Estado MODAL DE EDICIÓN de tarea ────────────────────────────
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('pending');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ── Estado MODAL DE PERFIL ───────────────────────────────────────
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhotoURL, setProfilePhotoURL] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Suscripción Firestore en tiempo real ────────────────────────
  // Clave del fix: [user?.uid] en lugar de [user].
  // El objeto `user` se recrea en cada onAuthStateChanged (token refresh,
  // focus, etc.), lo que con [user] causaba re-suscripciones innecesarias
  // que reponían isLoading=true y congelaban la vista.
  // Con [user?.uid] solo re-suscribimos cuando cambia el UID real.
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setTasks([]);
      return;
    }

    // Reinicia loading solo cuando el UID cambia (login de otro usuario)
    setIsLoading(true);

    const unsubscribe = subscribeToUserTasks(
      user.uid,
      (updatedTasks) => {
        setTasks(updatedTasks);
        setIsLoading(false); // ← primera respuesta de Firestore (incluso vacía)
      },
      (err) => {
        setError('Error al cargar tareas: ' + err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]); // ← dependencia correcta: solo el uid primitivo

  // ── Abrir modal edición de tarea ─────────────────────────────────
  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ?? '');
    setEditDueTime(task.dueTime ?? '');
  }

  function handleCloseEdit() { setEditingTask(null); }

  // ── Abrir modal de perfil ────────────────────────────────────────
  function handleOpenProfile() {
    setProfileName(user?.displayName ?? '');
    setProfilePhotoURL(user?.photoURL ?? '');
    setShowProfile(true);
  }

  // ── Crear tarea ──────────────────────────────────────────────────
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

      // Notificación email — secundaria, fallo silencioso en local
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL as string;
        await fetch(`${apiBase}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: `Nueva tarea: ${input.title}`,
            body: `Tarea creada:\n\nTítulo: ${input.title}\nEstado: ${input.status}\nFecha: ${input.dueDate ?? 'Sin fecha'}${input.dueTime ? ` ${input.dueTime}` : ''}\n\n— MateCode Tasks`,
          } satisfies EmailPayload),
        });
      } catch (notifyErr: unknown) {
        console.warn('[notify]', notifyErr);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la tarea.');
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  }

  // ── Guardar edición de tarea ─────────────────────────────────────
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
    } finally {
      setIsSavingEdit(false);
    }
  }

  // ── Foto desde dispositivo (FileReader + canvas resize) ──────────
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataURL(file);
      setProfilePhotoURL(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la imagen.');
    } finally {
      // Limpia el input para permitir volver a elegir el mismo archivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Guardar perfil ───────────────────────────────────────────────
  async function handleSaveProfile() {
    setIsSavingProfile(true);
    try {
      const update: ProfileUpdate = {
        displayName: profileName,
        photoURL: profilePhotoURL,
      };
      await updateProfile(update);
      setShowProfile(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  // ── Cambiar estado rápido ────────────────────────────────────────
  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try {
      await updateTaskStatus(taskId, status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado.');
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────
  async function handleDeleteTask(taskId: string) {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask(taskId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  }

  // ── Logout ───────────────────────────────────────────────────────
  async function handleLogout() {
    try { await logout(); } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión.');
    }
  }

  // ── Reset form nueva tarea ───────────────────────────────────────
  function resetForm() {
    setFormTitle(''); setFormDescription(''); setFormStatus('pending');
    setFormDueDate(''); setFormDueTime(''); setShowForm(false);
  }

  // ── Stats ────────────────────────────────────────────────────────
  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
  };

  const avatarLetter = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase();

  return (
    <div className="dashboard">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="navbar">
        {/* Izquierda: logo + toggle apilados */}
        <div className="navbar-brand">
          <div className="navbar-brand-top">
            <ClipboardList size={20} />
            <span>MateCode Tasks</span>
          </div>
          <div className="navbar-theme-row">
            <button
              id="theme-toggle-btn"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              style={{ width: '28px', height: '28px' }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <span className="navbar-theme-label">
              {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          </div>
        </div>

        {/* Derecha: perfil + logout */}
        <div className="navbar-user">
          <button
            id="profile-trigger-btn"
            className="profile-trigger"
            onClick={handleOpenProfile}
            aria-label="Editar perfil"
            title="Editar perfil"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? user.email}
                className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder" aria-hidden="true">
                {avatarLetter}
              </div>
            )}
            <span className="navbar-email">{user?.displayName ?? user?.email}</span>
          </button>

          <button id="logout-btn" className="btn btn-ghost btn-sm"
            onClick={handleLogout} aria-label="Cerrar sesión">
            <LogOut size={16} /><span>Salir</span>
          </button>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="dashboard-main">
        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar error">
              <X size={14} />
            </button>
          </div>
        )}

        <section className="stats-grid" aria-label="Resumen de tareas">
          <StatCard label="Total"       value={stats.total}      color="blue"   />
          <StatCard label="Pendientes"  value={stats.pending}    color="yellow" />
          <StatCard label="En progreso" value={stats.inProgress} color="purple" />
          <StatCard label="Completadas" value={stats.done}       color="green"  />
        </section>

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

        {/* Lista de tareas */}
        {isLoading ? (
          <div className="tasks-loading" role="status">
            <div className="loading-spinner" />
            <span>Cargando tareas...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="tasks-empty">
            <ClipboardList size={48} className="tasks-empty-icon" />
            <p>Todavía no tenés tareas.</p>
            <p className="tasks-empty-sub">Hacé clic en "Nueva tarea" para empezar.</p>
          </div>
        ) : (
          <ul className="tasks-list" aria-label="Lista de tareas">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task}
                onEdit={handleOpenEdit}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask} />
            ))}
          </ul>
        )}
      </main>

      {/* ── Modal edición de tarea ─────────────────────────────── */}
      {editingTask && (
        <div className="modal-overlay" role="dialog" aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseEdit(); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 id="edit-modal-title" className="modal-title">Editar tarea</h2>
              <button className="modal-close" onClick={handleCloseEdit} aria-label="Cerrar"><X size={18} /></button>
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

      {/* ── Modal de perfil ───────────────────────────────────────── */}
      {showProfile && (
        <div className="modal-overlay" role="dialog" aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}>
          <div className="modal modal--profile">
            <div className="modal-header">
              <h2 id="profile-modal-title" className="modal-title">Mi perfil</h2>
              <button className="modal-close" onClick={() => setShowProfile(false)}
                aria-label="Cerrar perfil"><X size={18} /></button>
            </div>

            {/* Vista previa grande del avatar */}
            <div className="profile-avatar-preview">
              {profilePhotoURL ? (
                <img src={profilePhotoURL} alt="Vista previa"
                  className="profile-avatar-lg"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="profile-avatar-lg-placeholder" aria-hidden="true">
                  {avatarLetter}
                </div>
              )}
              <span className="profile-email-badge">{user?.email}</span>
            </div>

            {/* Campo nombre */}
            <div className="form-field">
              <label htmlFor="profile-name" className="form-label">Nombre visible / alias</label>
              <div className="form-input-wrapper">
                <User size={16} className="form-input-icon" />
                <input id="profile-name" type="text" className="form-input"
                  value={profileName} onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre o alias" autoFocus />
              </div>
            </div>

            {/* ── Subida de foto desde dispositivo ───────────────── */}
            <div>
              <p className="modal-section-label">Foto desde tu dispositivo</p>
              <div className="file-upload-area">
                {/* Input oculto — activado por el botón */}
                <input
                  ref={fileInputRef}
                  id="profile-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="file-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Elegir foto desde tu dispositivo"
                >
                  <ImagePlus size={15} />
                  Elegir foto
                </button>
                <span className="file-upload-hint">
                  JPG, PNG o WebP · máx ~3 MB · se comprime a 220 px
                </span>
              </div>
            </div>

            {/* ── URL manual ─────────────────────────────────────── */}
            <div className="form-field">
              <label htmlFor="profile-photo" className="form-label">
                O pegá una URL de imagen
              </label>
              <input id="profile-photo" type="url" className="form-input"
                value={profilePhotoURL}
                onChange={(e) => setProfilePhotoURL(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg" />
            </div>

            {/* ── Galería de avatares predeterminados ────────────── */}
            <div>
              <p className="modal-section-label">Avatares predeterminados</p>
              <div className="avatar-gallery" role="listbox"
                aria-label="Galería de avatares">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    className={`avatar-option${profilePhotoURL === av.url ? ' avatar-option--selected' : ''}`}
                    onClick={() => setProfilePhotoURL(av.url)}
                    title={av.label}
                    aria-label={`Seleccionar avatar ${av.label}`}
                    aria-selected={profilePhotoURL === av.url}
                    role="option"
                  >
                    <img
                      src={av.url}
                      alt={av.label}
                      loading="lazy"
                      onError={(e) => {
                        // Fallback si DiceBear no carga
                        (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowProfile(false)}>
                Cancelar
              </button>
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

// ── TaskCard ──────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function TaskCard({ task, onEdit, onStatusChange, onDelete }: TaskCardProps) {
  const isOverdue = task.dueDate && task.status !== 'done' && task.dueDate < TODAY;

  const formattedDate = task.dueDate
    ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : null;

  const dateTimeLabel = formattedDate
    ? task.dueTime ? `${formattedDate} ${task.dueTime}` : formattedDate
    : null;

  return (
    <li className={`task-card task-card--${task.status}`}>
      <div className="task-status-badge" title={STATUS_LABELS[task.status]}>
        {STATUS_ICONS[task.status]}
      </div>
      <div className="task-content">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-description">{task.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`task-status-label task-status-label--${task.status}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {dateTimeLabel && (
            <span className={`task-due-date${isOverdue ? ' task-due-date--overdue' : ''}`}
              title={isOverdue ? 'Fecha vencida' : 'Fecha límite'}>
              <CalendarDays size={10} />
              {dateTimeLabel}{isOverdue && ' · Vencida'}
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

// ── StatCard ──────────────────────────────────────────────────────
interface StatCardProps { label: string; value: number; color: 'blue'|'yellow'|'purple'|'green'; }
function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
