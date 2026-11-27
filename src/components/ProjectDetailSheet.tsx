import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
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
import { buildClientPortalUrl } from '../lib/portalLink';
import { getProjectWhatsAppTemplates } from '../lib/whatsappTemplates';
import {
  generatePaymentReceiptPdf,
  generatePaymentReceiptPng,
} from '../lib/receiptGenerator';

const FORMAT_OPTIONS: ProjectFormat[] = ['Reel/TikTok', 'YouTube', 'Foto', 'Diseño'];

export const ProjectDetailSheet: React.FC = () => {
  const {
    projects,
    clients,
    settings,
    selectedProjectId,
    setSelectedProjectId,
    setPreviewPortalProjectId,
    upsertProject,
    deleteProject,
    hasMissingClientMaterial,
    showToast,
  } = useStudio();

  const [newClientItem, setNewClientItem] = useState('');
  const [newEditorItem, setNewEditorItem] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generatingPng, setGeneratingPng] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const client = useMemo(
    () => clients.find((c) => c.id === project?.clientId),
    [clients, project?.clientId]
  );

  const portalUrl = useMemo(() => {
    if (!project) return '';
    return buildClientPortalUrl(project, settings, client?.name);
  }, [project, settings, client?.name]);

  const waTemplates = useMemo(() => {
    if (!project) return [];
    return getProjectWhatsAppTemplates(project, settings, portalUrl, client);
  }, [project, settings, portalUrl, client]);

  if (!project) return null;

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

  const openWhatsAppText = (rawMessage: string) => {
    const encoded = encodeURIComponent(rawMessage);
    const cleanPhone = (client?.phone || '').replace(/[^\d]/g, '');
    window.open(
      cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`,
      '_blank'
    );
  };

  const copyText = async (text: string, toastMsg: string) => {
    await navigator.clipboard.writeText(text);
    showToast(toastMsg, 'success');
  };

  const openExternal = (url?: string) => {
    if (!url) return;
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    window.open(normalized, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPngReceipt = async () => {
    setGeneratingPng(true);
    try {
      await generatePaymentReceiptPng(project, settings, client);
      showToast('Recibo PNG en alta resolución descargado 🖼️', 'success');
    } finally {
      setGeneratingPng(false);
    }
  };

  const handleDownloadPdfReceipt = () => {
    generatePaymentReceiptPdf(project, settings, client);
    showToast('Recibo PDF descargado correctamente 📄', 'success');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex justify-end overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          onClick={() => setSelectedProjectId(null)}
        />

        {/* Slide-over Motion Sheet */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 330, damping: 32 }}
          className="relative z-10 w-full max-w-2xl h-full overflow-y-auto bg-obsidian-950 text-white shadow-2xl flex flex-col"
        >
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
              Ficha Completa del Proyecto
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

          {/* Hero Title + Client Tracking Link + Core Meta Pills */}
          <div className="px-6 pt-5 pb-6 space-y-4">
            {missingMat && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between gap-2 rounded-2xl bg-tangerine-accent/15 border border-tangerine-accent/40 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-tangerine-accent">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Alerta activa: Falta material del cliente</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const tpl = waTemplates.find((t) => t.id === 'missing_material');
                    if (tpl) openWhatsAppText(tpl.buildMessage());
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-tangerine-accent px-2.5 py-1 text-[11px] font-extrabold text-white hover:opacity-90"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Pedir ahora
                </button>
              </motion.div>
            )}

            <input
              type="text"
              value={project.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Título del proyecto..."
              className="w-full bg-transparent font-display text-2xl sm:text-3xl font-extrabold text-white focus:outline-none"
            />

            {/* PUBLIC CLIENT PORTAL LINK BAR */}
            <div className="rounded-2xl bg-gradient-to-r from-obsidian-900 via-obsidian-800 to-obsidian-900 border border-lime-accent/30 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-accent text-obsidian-950 shadow-glow-lime">
                  <Share2 className="h-4 w-4 stroke-[2.5]" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">
                    Link Público de Seguimiento para el Cliente
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    El cliente ve el progreso en tiempo real sin necesidad de PIN
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setPreviewPortalProjectId(project.id);
                  }}
                  title="Ver cómo lo ve tu cliente"
                  className="inline-flex items-center gap-1 rounded-xl bg-obsidian-950 border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-lime-accent"
                >
                  <Eye className="h-3.5 w-3.5 text-lime-accent" />
                  <span>Vista Previa</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      portalUrl,
                      '🔗 Link público del cliente copiado al portapapeles'
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl bg-lime-accent px-3 py-1.5 text-[11px] font-extrabold text-obsidian-950 hover:bg-lime-hover"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Link</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppText(
                      `Hola ${client?.name || ''} 👋 Aquí tienes el enlace en vivo para ver el estado y avance de *"${project.title}"* en tiempo real:\n\n🔗 ${portalUrl}`
                    )
                  }
                  title="Enviar link por WhatsApp"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-1.5 text-emerald-400 hover:bg-emerald-500/30"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metadata Selectors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

          {/* =================================================================
              SIGNATURE ELECTRIC LIME SHEET (Description + Revision Counter)
          ================================================================= */}
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
              rows={2}
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

          {/* =================================================================
              LOWER OVERLAPPING WORKSPACE SHEET
          ================================================================= */}
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
                    <motion.div
                      layout
                      whileTap={{ scale: 0.98 }}
                      key={item.id}
                      onClick={() => toggleChecklist('clientChecklist', item.id)}
                      className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-obsidian-800/70 px-3.5 py-2.5 cursor-pointer hover:border-tangerine-accent/50 transition-colors"
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
                    </motion.div>
                  ))}
                </div>

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
                    <motion.div
                      layout
                      whileTap={{ scale: 0.98 }}
                      key={item.id}
                      onClick={() => toggleChecklist('editorChecklist', item.id)}
                      className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-obsidian-800/70 px-3.5 py-2.5 cursor-pointer hover:border-lime-accent/50 transition-colors"
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
                    </motion.div>
                  ))}
                </div>

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

            {/* SECTION 2: 1-CLICK WHATSAPP TEMPLATES */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-extrabold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Plantillas de WhatsApp en 1 Clic
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">
                  Autocompletadas con datos del proyecto
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {waTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200 dark:border-white/10 p-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="inline-block rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-500 mb-1">
                        {tpl.badge}
                      </span>
                      <p className="text-xs font-bold truncate">{tpl.label}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            tpl.buildMessage(),
                            `Plantilla "${tpl.label}" copiada 📋`
                          )
                        }
                        title="Copiar mensaje"
                        className="rounded-xl bg-slate-200/80 dark:bg-obsidian-700 p-2 text-slate-600 dark:text-slate-300 hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openWhatsAppText(tpl.buildMessage())}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-2.5 py-2 text-[11px] font-extrabold text-obsidian-950 hover:bg-emerald-400 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: ENLACES RÁPIDOS EN 1 CLIC */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
              <h4 className="font-display text-base font-extrabold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-violet-accent" />
                Enlaces Rápidos del Proyecto
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'drive',
                    label: 'Google Drive (RAW / Carpeta)',
                    placeholder: 'https://drive.google.com/...',
                  },
                  {
                    key: 'wetransfer',
                    label: 'WeTransfer / Descarga',
                    placeholder: 'https://we.tl/...',
                  },
                  {
                    key: 'frameio',
                    label: 'Frame.io (Revisión)',
                    placeholder: 'https://app.frame.io/...',
                  },
                  {
                    key: 'references',
                    label: 'Referencias Visuales',
                    placeholder: 'https://instagram.com/...',
                  },
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

            {/* SECTION 4: ESTADO DE PAGO + RECIBOS EN PDF Y PNG */}
            <div className="space-y-3.5 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-extrabold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-lime-accent" />
                  Control de Pago y Comprobantes
                </h4>
              </div>

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

              {/* DOWNLOAD RECEIPT BUTTONS (PNG + PDF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={generatingPng}
                  onClick={handleDownloadPngReceipt}
                  className="motion-shimmer flex items-center justify-center gap-2 rounded-2xl bg-lime-accent py-3 px-4 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover transition-transform active:scale-98"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>
                    {generatingPng
                      ? 'Generando imagen...'
                      : 'Descargar Recibo PNG (WhatsApp)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdfReceipt}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 py-3 px-4 text-xs font-extrabold text-slate-800 dark:text-white hover:border-violet-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-violet-400" />
                  <span>Descargar Recibo PDF</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
