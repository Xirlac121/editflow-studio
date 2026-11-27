import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { Film, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import {
  DEFAULT_CLIENT_CHECKLIST,
  DEFAULT_EDITOR_CHECKLIST,
  KANBAN_COLUMNS,
  PaymentStatus,
  Project,
  ProjectFormat,
  ProjectPriority,
  ProjectStatus,
} from '../types/studio';

interface NewProjectModalProps {
  initialStatus?: ProjectStatus;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  initialStatus = 'en_edicion',
  onClose,
}) => {
  const { clients, settings, upsertProject, setSelectedProjectId, showToast } =
    useStudio();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [formatType, setFormatType] = useState<ProjectFormat>('Reel/TikTok');
  const [priority, setPriority] = useState<ProjectPriority>('normal');
  const [dueDate, setDueDate] = useState(
    format(addDays(new Date(), 3), 'yyyy-MM-dd')
  );
  const [price, setPrice] = useState(200);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('sin_pagar');
  const [revisionsIncluded, setRevisionsIncluded] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const amountPaid =
      paymentStatus === 'pagado'
        ? price
        : paymentStatus === 'anticipo'
        ? Math.round(price * 0.5)
        : 0;

    const newProj: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      description: '',
      clientId,
      status,
      priority,
      format: formatType,
      dueDate,
      price,
      amountPaid,
      paymentStatus,
      revisionsUsed: 0,
      revisionsIncluded,
      clientChecklist: DEFAULT_CLIENT_CHECKLIST(),
      editorChecklist: DEFAULT_EDITOR_CHECKLIST(formatType),
      links: { drive: '', wetransfer: '', frameio: '', references: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertProject(newProj);
    showToast('Proyecto creado en el Kanban', 'success');
    onClose();
    setSelectedProjectId(newProj.id);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950">
              <Film className="h-5 w-5" />
            </span>
            <h3 className="font-display text-xl font-bold">Nuevo Proyecto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Edición Pack 6 Reels + Subtítulos"
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Cliente
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm font-semibold focus:outline-none"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Columna Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm font-semibold focus:outline-none"
              >
                {KANBAN_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Formato
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value as ProjectFormat)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="Reel/TikTok">Reel/TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Foto">Foto</option>
                <option value="Diseño">Diseño</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="urgente">🔥 Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Entrega
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Precio ({settings.currency})
              </label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Estado Pago
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              >
                <option value="sin_pagar">Sin pagar</option>
                <option value="anticipo">Anticipo 50%</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Revisiones Incl.
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={revisionsIncluded}
                onChange={(e) =>
                  setRevisionsIncluded(Math.max(0, Number(e.target.value)))
                }
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-lime-accent px-6 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover"
            >
              Crear y Abrir Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
