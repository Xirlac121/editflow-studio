import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  ExternalLink,
  FolderOpen,
  Link2,
  MessageCircle,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import {
  ChecklistItem,
  KANBAN_COLUMNS,
  PaymentStatus,
  ProjectFormat,
  ProjectPriority,
  ProjectStatus,
} from '../types/studio';

const FORMAT_OPTIONS: ProjectFormat[] = ['Reel/TikTok', 'YouTube', 'Foto', 'Diseño'];

export const ProjectDetailSheet: React.FC = () => {
  const {
    projects,
    clients,
    settings,
    selectedProjectId,
    setSelectedProjectId,
    upsertProject,
    deleteProject,
    hasMissingClientMaterial,
  } = useStudio();

  const [newClientItem, setNewClientItem] = useState('');
  const [newEditorItem, setNewEditorItem] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  if (!project) return null;

  const client = clients.find((c) => c.id === project.clientId);
  const missingMat = hasMissingClientMaterial(project);
  const extraRevisions = Math.max(0, project.revisionsUsed - project.revisionsIncluded);

  const patch = (fields: Partial<typeof project>) => {
    upsertProject({ ...project, ...fields });
  };

  const toggleChecklist = (
    listKey: 'clientChecklist' | 'editorChecklist',
    itemId: string
  ) => {
    const updated = project[listKey].map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    patch({ [listKey]: updated });
  };

  const addChecklistItem = (
    listKey: 'clientChecklist' | 'editorChecklist',
    label: string,
    clearFn: (v: string) => void
  ) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: trimmed,
      completed: false,
    };
    patch({ [listKey]: [...project[listKey], newItem] });
    clearFn('');
  };

  const removeChecklistItem = (
    listKey: 'clientChecklist' | 'editorChecklist',
    itemId: string
  ) => {
    patch({
      [listKey]: project[listKey].filter((i) => i.id !== itemId),
    });
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    let nextPaid = project.amountPaid;
    if (status === 'pagado') {
      nextPaid = project.price;
    } else if (status === 'sin_pagar') {
      nextPaid = 0;
    } else if (status === 'anticipo' && project.amountPaid === 0) {
      nextPaid = Math.round(project.price * 0.5);
    }
    patch({ paymentStatus: status, amountPaid: nextPaid });
  };

  const sendWhatsAppMissing = () => {
    const pending = project.clientChecklist
      .filter((i) => !i.completed)
      .map((i) => `• ${i.label}`)
      .join('\n');
    const msg = encodeURIComponent(
      `Hola ${client?.name || ''} 👋 Te escribo respecto a "${project.title}".\n\nPara continuar con la edición me faltaría recibir:\n${
        pending || '• Material del proyecto'
      }\n\n¡Quedo atento!`
    );
    const cleanPhone = (client?.phone || '').replace(/[^\d]/g, '');
    window.open(
      cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`,
      '_blank'
    );
  };

  const openExternal = (url?: string) => {
    if (!url) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    window.open(normalized, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setSelectedProjectId(null)}
      />

      {/* Slide-over Sheet modeled after Right Screen in Reference Image */}
      <div className="relative z-10 w-full max-w-2xl h-full overflow-y-auto bg-obsidian-950 text-white shadow-2xl flex flex-col">
        {/* Top Dark Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-obsidian-950/95 backdrop-blur-md px-5 py-4 border-b border-white/5">
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-800 border border-white/10 text-white hover:border-lime-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-bold tracking-wide text-slate-300">
            Ficha del Proyecto
          </span>

          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Eliminar proyecto"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-800 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => deleteProject(project.id)}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-obsidian-800 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero Title + Core Meta Pills */}
        <div className="px-6 pt-5 pb-6 space-y-4">
          {missingMat && (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-tangerine-accent/15 border border-tangerine-accent/40 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-tangerine-accent">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Alerta activa: Falta material del cliente</span>
              </div>
              <button
                type="button"
                onClick={sendWhatsAppMissing}
                className="inline-flex items-center gap-1 rounded-xl bg-tangerine-accent px-2.5 py-1 text-[11px] font-extrabold text-white hover:opacity-90"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Pedir por WhatsApp
              </button>
            </div>
          )}

          <input
            type="text"
            value={project.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Título del proyecto..."
            className="w-full bg-transparent font-display text-2xl sm:text-3xl font-extrabold text-white focus:outline-none focus:ring-b focus:border-lime-accent"
          />

          {/* Metadata Selectors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Due Date */}
            <div className="rounded-2xl bg-obsidian-900 border border-white/10 px-3 py-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fecha Entrega
              </label>
              <div className="mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-lime-accent shrink-0" />
                <input
                  type="date"
                  value={project.dueDate}
                  onChange={(e) => patch({ dueDate: e.target.value })}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Kanban Column Status */}
            <div className="rounded-2xl bg-obsidian-900 border border-white/10 px-3 py-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Columna Kanban
              </label>
              <select
                value={project.status}
                onChange={(e) => patch({ status: e.target.value as ProjectStatus })}
                className="mt-1 w-full bg-obsidian-900 text-xs font-bold text-lime-accent focus:outline-none"
              >
                {KANBAN_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="rounded-2xl bg-obsidian-900 border border-white/10 px-3 py-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Prioridad
              </label>
              <select
                value={project.priority}
                onChange={(e) =>
                  patch({ priority: e.target.value as ProjectPriority })
                }
                className={`mt-1 w-full bg-obsidian-900 text-xs font-bold focus:outline-none ${
                  project.priority === 'urgente'
                    ? 'text-tangerine-accent'
                    : 'text-white'
                }`}
              >
                <option value="normal">Normal</option>
                <option value="urgente">🔥 Urgente</option>
              </select>
            </div>

            {/* Format */}
            <div className="rounded-2xl bg-obsidian-900 border border-white/10 px-3 py-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formato
              </label>
              <select
                value={project.format}
                onChange={(e) =>
                  patch({ format: e.target.value as ProjectFormat })
                }
                className="mt-1 w-full bg-obsidian-900 text-xs font-bold text-violet-300 focus:outline-none"
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-obsidian-900 border border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Cliente:</span>
              <select
                value={project.clientId}
                onChange={(e) => patch({ clientId: e.target.value })}
                className="bg-obsidian-900 font-bold text-white focus:outline-none"
              >
                <option value="">Sin cliente asignado</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.company}
                  </option>
                ))}
              </select>
            </div>

            {client?.brandFolderUrl && (
              <button
                type="button"
                onClick={() => openExternal(client.brandFolderUrl)}
                className="inline-flex items-center gap-1 text-xs font-bold text-lime-accent hover:underline"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Carpeta de Logos/Marca ↗
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================
            SIGNATURE ELECTRIC LIME SHEET (Description + Revision Counter)
            Modeled directly after Right Phone in Reference Image
        =================================================================== */}
        <div className="rounded-t-[34px] bg-lime-accent text-obsidian-950 px-6 pt-4 pb-10">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-obsidian-950/30" />

          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-display text-lg font-extrabold">
              Notas y Brief de Edición
            </h3>
            {client?.preferencesNotes && (
              <span className="text-[11px] font-bold bg-obsidian-950/10 px-2.5 py-0.5 rounded-full">
                Estilo cliente cargado
              </span>
            )}
          </div>

          <textarea
            rows={3}
            value={project.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Describe el estilo de edición, duración, referencias, entregables..."
            className="w-full rounded-2xl bg-obsidian-950/10 placeholder:text-obsidian-950/50 p-3 text-sm font-medium text-obsidian-950 focus:outline-none focus:bg-obsidian-950/15 resize-none"
          />

          {client?.preferencesNotes && (
            <p className="mt-2 rounded-xl bg-obsidian-950/10 px-3 py-2 text-xs font-semibold text-obsidian-950/85">
              💡 <strong>Preferencia de {client.name}:</strong> {client.preferencesNotes}
            </p>
          )}

          {/* Revision Rounds Counter Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-obsidian-950 text-white px-4 py-3">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-lime-accent" />
              <div>
                <p className="text-xs font-extrabold">
                  Revisión {project.revisionsUsed} de {project.revisionsIncluded} incluidas
                </p>
                {extraRevisions > 0 ? (
                  <p className="text-[11px] font-bold text-tangerine-accent">
                    ¡+{extraRevisions} ronda(s) extra para cobrar!
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Control de cambios del cliente
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  patch({ revisionsUsed: Math.max(0, project.revisionsUsed - 1) })
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-display text-base font-extrabold w-5 text-center text-lime-accent">
                {project.revisionsUsed}
              </span>
              <button
                type="button"
                onClick={() => patch({ revisionsUsed: project.revisionsUsed + 1 })}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-accent text-obsidian-950 font-bold"
              >
                <Plus className="h-4 w-4 stroke-[2.6]" />
              </button>

              <div className="ml-2 pl-2 border-l border-white/15 flex items-center gap-1 text-xs">
                <span className="text-slate-400">Incl:</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={project.revisionsIncluded}
                  onChange={(e) =>
                    patch({ revisionsIncluded: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-10 rounded-lg bg-obsidian-800 px-1.5 py-1 text-center font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            LOWER OVERLAPPING WORKSPACE SHEET:
            Dual Checklists ("Cosas que faltan") + Quick Links + Payment Control
        =================================================================== */}
        <div className="-mt-5 flex-1 rounded-t-[34px] bg-white text-slate-900 dark:bg-obsidian-900 dark:text-white px-6 pt-7 pb-12 space-y-7 border-t border-white/10">
          {/* SECTION 1: COSAS QUE FALTAN (2 SEPARATE CHECKLISTS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checklist A: Pendientes del Cliente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-extrabold flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-tangerine-accent" />
                  Pendientes del Cliente
                </h4>
                <span className="text-xs font-bold text-slate-400">
                  {project.clientChecklist.filter((i) => i.completed).length}/
                  {project.clientChecklist.length}
                </span>
              </div>

              <div className="space-y-2">
                {project.clientChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist('clientChecklist', item.id)}
                    className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-obsidian-800/70 px-3.5 py-2.5 cursor-pointer hover:border-tangerine-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          item.completed
                            ? 'bg-obsidian-950 dark:bg-lime-accent border-transparent text-white dark:text-obsidian-950'
                            : 'border-slate-400 dark:border-slate-500'
                        }`}
                      >
                        {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChecklistItem('clientChecklist', item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Client Item Pill */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addChecklistItem('clientChecklist', newClientItem, setNewClientItem);
                }}
                className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-obsidian-800 px-3 py-1.5 border border-slate-200 dark:border-white/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-obsidian-700 text-slate-600 dark:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={newClientItem}
                  onChange={(e) => setNewClientItem(e.target.value)}
                  placeholder="Agregar pendiente (ej. Guion, Logos)..."
                  className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                />
              </form>
            </div>

            {/* Checklist B: Tareas Propias del Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-extrabold flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-lime-accent" />
                  Tareas de Edición
                </h4>
                <span className="text-xs font-bold text-slate-400">
                  {project.editorChecklist.filter((i) => i.completed).length}/
                  {project.editorChecklist.length}
                </span>
              </div>

              <div className="space-y-2">
                {project.editorChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist('editorChecklist', item.id)}
                    className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-obsidian-800/70 px-3.5 py-2.5 cursor-pointer hover:border-lime-accent/50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          item.completed
                            ? 'bg-obsidian-950 dark:bg-lime-accent border-transparent text-white dark:text-obsidian-950'
                            : 'border-slate-400 dark:border-slate-500'
                        }`}
                      >
                        {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChecklistItem('editorChecklist', item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Editor Task Pill */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addChecklistItem('editorChecklist', newEditorItem, setNewEditorItem);
                }}
                className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-obsidian-800 px-3 py-1.5 border border-slate-200 dark:border-white/10"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-obsidian-700 text-slate-600 dark:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={newEditorItem}
                  onChange={(e) => setNewEditorItem(e.target.value)}
                  placeholder="Agregar tarea (ej. Color, Subtítulos)..."
                  className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                />
              </form>
            </div>
          </div>

          {/* SECTION 2: ENLACES RÁPIDOS EN 1 CLIC */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <h4 className="font-display text-base font-extrabold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-violet-accent" />
              Enlaces Rápidos del Proyecto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'drive', label: 'Google Drive (RAW / Carpeta)', placeholder: 'https://drive.google.com/...' },
                { key: 'wetransfer', label: 'WeTransfer / Descarga', placeholder: 'https://we.tl/...' },
                { key: 'frameio', label: 'Frame.io (Revisión)', placeholder: 'https://app.frame.io/...' },
                { key: 'references', label: 'Referencias Visuales', placeholder: 'https://instagram.com/...' },
              ].map((field) => {
                const val = project.links[field.key as keyof typeof project.links] || '';
                return (
                  <div
                    key={field.key}
                    className="rounded-2xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200 dark:border-white/10 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {field.label}
                      </label>
                      {val && (
                        <button
                          type="button"
                          onClick={() => openExternal(val)}
                          className="inline-flex items-center gap-1 rounded-lg bg-lime-accent px-2 py-0.5 text-[10px] font-extrabold text-obsidian-950 hover:bg-lime-hover"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={val}
                      onChange={(e) =>
                        patch({
                          links: { ...project.links, [field.key]: e.target.value },
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: ESTADO DE PAGO Y MONTOS */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <h4 className="font-display text-base font-extrabold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-lime-accent" />
              Control de Pago del Proyecto
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'sin_pagar', label: 'Sin pagar' },
                  { id: 'anticipo', label: 'Anticipo recibido' },
                  { id: 'pagado', label: 'Pagado 100%' },
                ] as { id: PaymentStatus; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePaymentStatusChange(opt.id)}
                  className={`rounded-2xl py-2.5 px-3 text-xs font-bold border transition-all ${
                    project.paymentStatus === opt.id
                      ? 'bg-lime-accent text-obsidian-950 border-lime-accent font-extrabold'
                      : 'bg-slate-50 dark:bg-obsidian-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3 border border-slate-200 dark:border-white/10">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Total ({settings.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={project.price}
                  onChange={(e) => patch({ price: Math.max(0, Number(e.target.value)) })}
                  className="mt-1 w-full bg-transparent font-display text-lg font-extrabold focus:outline-none"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3 border border-slate-200 dark:border-white/10">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Cobrado ({settings.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={project.amountPaid}
                  onChange={(e) => {
                    const paid = Math.max(0, Number(e.target.value));
                    const nextStatus: PaymentStatus =
                      paid >= project.price && project.price > 0
                        ? 'pagado'
                        : paid > 0
                        ? 'anticipo'
                        : 'sin_pagar';
                    patch({ amountPaid: paid, paymentStatus: nextStatus });
                  }}
                  className="mt-1 w-full bg-transparent font-display text-lg font-extrabold text-emerald-500 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3 border border-slate-200 dark:border-white/10">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Pendiente
                </label>
                <p className="mt-1 font-display text-lg font-extrabold text-tangerine-accent">
                  {settings.currency}
                  {Math.max(0, project.price - project.amountPaid)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
