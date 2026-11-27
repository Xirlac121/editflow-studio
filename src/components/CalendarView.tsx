import React, { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { BlockedDate, KANBAN_COLUMNS, ProjectStatus } from '../types/studio';

const STATUS_CHIP_STYLES: Record<ProjectStatus, string> = {
  por_cotizar: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-400/30',
  esperando_material: 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/40',
  en_edicion: 'bg-lime-accent text-obsidian-950 border-lime-accent font-extrabold',
  en_revision: 'bg-violet-accent/25 text-violet-700 dark:text-violet-200 border-violet-400/40',
  ajustes: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/40',
  entregado: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 line-through opacity-80',
};

export const BlockDateModal: React.FC<{
  initialDate?: string;
  onClose: () => void;
}> = ({ initialDate, onClose }) => {
  const { upsertBlockedDate, showToast } = useStudio();
  const todayStr = initialDate || format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [type, setType] = useState<'tentativo' | 'no_disponible'>('tentativo');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const item: BlockedDate = {
      id: `blk-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      type,
      notes: notes.trim(),
    };

    await upsertBlockedDate(item);
    showToast('Fechas reservadas en el calendario', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tangerine-accent text-white">
              <CalendarOff className="h-5 w-5" />
            </span>
            <h3 className="font-display text-lg font-bold">
              Bloquear Fechas / Reserva Tentativa
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Motivo o Trabajo Tentativo *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Reserva edición lanzamiento cliente X"
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Hasta
              </label>
              <input
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Tipo de bloqueo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('tentativo')}
                className={`rounded-2xl py-2.5 text-xs font-bold border ${
                  type === 'tentativo'
                    ? 'bg-violet-accent text-obsidian-950 border-violet-accent font-extrabold'
                    : 'bg-slate-100 dark:bg-obsidian-800 border-white/10 text-slate-400'
                }`}
              >
                Proyecto Tentativo
              </button>
              <button
                type="button"
                onClick={() => setType('no_disponible')}
                className={`rounded-2xl py-2.5 text-xs font-bold border ${
                  type === 'no_disponible'
                    ? 'bg-tangerine-accent text-white border-tangerine-accent font-extrabold'
                    : 'bg-slate-100 dark:bg-obsidian-800 border-white/10 text-slate-400'
                }`}
              >
                No Disponible / Libre
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Notas opcionales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de disponibilidad..."
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-lime-accent px-5 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime"
            >
              Guardar en Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CalendarView: React.FC = () => {
  const {
    projects,
    blockedDates,
    deleteBlockedDate,
    setSelectedProjectId,
    quickFilters,
    hasMissingClientMaterial,
  } = useStudio();

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [blockModalDate, setBlockModalDate] = useState<string | null>(null);

  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (quickFilters.onlyUrgent && p.priority !== 'urgente') return false;
      if (quickFilters.onlyPendingPayment && p.price <= p.amountPaid) return false;
      if (quickFilters.onlyMissingMaterial && !hasMissingClientMaterial(p)) return false;
      if (quickFilters.searchQuery.trim()) {
        const q = quickFilters.searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, quickFilters, hasMissingClientMaterial]);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
      const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [cursorDate, viewMode]);

  const handlePrev = () => {
    setCursorDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  const handleNext = () => {
    setCursorDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-lime-accent" />
            Calendario de Entregas y Disponibilidad
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sincronizado automáticamente con las fechas del Kanban. Reserva días tentativos para no saturarte.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month / Week Toggle */}
          <div className="inline-flex rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-lime-accent text-obsidian-950 font-extrabold'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-lime-accent text-obsidian-950 font-extrabold'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              Semanal
            </button>
          </div>

          <button
            type="button"
            onClick={() => setBlockModalDate(format(new Date(), 'yyyy-MM-dd'))}
            className="inline-flex items-center gap-2 rounded-2xl bg-obsidian-900 dark:bg-obsidian-800 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:border-lime-accent transition-colors"
          >
            <CalendarOff className="h-4 w-4 text-tangerine-accent" />
            <span>Bloquear Fechas</span>
          </button>
        </div>
      </div>

      {/* Navigation & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-obsidian-800 hover:border-lime-accent border border-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="font-display text-lg font-extrabold capitalize min-w-[165px] text-center">
            {viewMode === 'month'
              ? format(cursorDate, 'MMMM yyyy', { locale: es })
              : `Semana del ${format(calendarDays[0], 'd MMM', { locale: es })}`}
          </h3>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-obsidian-800 hover:border-lime-accent border border-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursorDate(new Date())}
            className="rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-lime-accent"
          >
            Hoy
          </button>
        </div>

        {/* Status Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {KANBAN_COLUMNS.map((col) => (
            <span key={col.id} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
              {col.shortTitle}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-obsidian-900">
          {dayNames.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/5 ${
            viewMode === 'month' ? '' : 'min-h-[380px]'
          }`}
        >
          {calendarDays.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const isToday = isSameDay(day, new Date());
            const inCurrentMonth =
              viewMode === 'week' || isSameMonth(day, cursorDate);

            const dayProjects = visibleProjects.filter((p) => p.dueDate === iso);
            const dayBlocks = blockedDates.filter((b) => {
              try {
                return isWithinInterval(day, {
                  start: parseISO(b.startDate),
                  end: addDays(parseISO(b.endDate), 0),
                });
              } catch {
                return b.startDate === iso;
              }
            });

            return (
              <div
                key={iso}
                onDoubleClick={() => setBlockModalDate(iso)}
                className={`p-2.5 sm:min-h-[135px] flex flex-col gap-1.5 border-b border-slate-200 dark:border-white/5 transition-colors ${
                  !inCurrentMonth
                    ? 'opacity-40 bg-slate-50/50 dark:bg-obsidian-950/40'
                    : dayBlocks.length > 0
                    ? 'bg-violet-accent/[0.06] dark:bg-violet-accent/[0.05]'
                    : ''
                }`}
              >
                {/* Day Number Row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                      isToday
                        ? 'bg-lime-accent text-obsidian-950 shadow-glow-lime'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  <span className="sm:hidden text-xs font-bold capitalize text-slate-400">
                    {format(day, 'EEEE d MMM', { locale: es })}
                  </span>

                  <button
                    type="button"
                    onClick={() => setBlockModalDate(iso)}
                    title="Bloquear este día"
                    className="opacity-60 hover:opacity-100 text-[10px] font-bold text-slate-400 hover:text-lime-accent px-1"
                  >
                    +
                  </button>
                </div>

                {/* Blocked / Tentative Indicators */}
                {dayBlocks.map((blk) => (
                  <div
                    key={blk.id}
                    className={`group flex items-center justify-between gap-1 rounded-xl px-2 py-1 text-[10px] font-bold border ${
                      blk.type === 'tentativo'
                        ? 'bg-violet-accent/20 border-violet-accent/40 text-violet-600 dark:text-violet-300'
                        : 'bg-tangerine-accent/20 border-tangerine-accent/40 text-tangerine-accent'
                    }`}
                  >
                    <span className="truncate">🔒 {blk.title}</span>
                    <button
                      type="button"
                      onClick={() => deleteBlockedDate(blk.id)}
                      title="Quitar bloqueo"
                      className="opacity-70 hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Project Delivery Pills */}
                {dayProjects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full text-left rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-transform hover:scale-[1.02] truncate ${
                      STATUS_CHIP_STYLES[proj.status]
                    }`}
                  >
                    {proj.priority === 'urgente' ? '🔥 ' : ''}
                    {proj.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {blockModalDate && (
        <BlockDateModal
          initialDate={blockModalDate}
          onClose={() => setBlockModalDate(null)}
        />
      )}
    </div>
  );
};
