import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  Flame,
  GripVertical,
  Layers,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import {
  KANBAN_COLUMNS,
  Project,
  ProjectStatus,
} from '../types/studio';

interface KanbanCardProps {
  project: Project;
  clientName: string;
  currency: string;
  missingMaterial: boolean;
  onOpen: () => void;
  onQuickStatusChange: (status: ProjectStatus) => void;
  isOverlay?: boolean;
}

const KanbanCardContent: React.FC<
  KanbanCardProps & {
    dragHandleProps?: Record<string, any>;
  }
> = ({
  project,
  clientName,
  currency,
  missingMaterial,
  onOpen,
  onQuickStatusChange,
  isOverlay,
  dragHandleProps,
}) => {
  const editorDone = project.editorChecklist.filter((i) => i.completed).length;
  const editorTotal = project.editorChecklist.length;
  const editorPct = editorTotal > 0 ? Math.round((editorDone / editorTotal) * 100) : 0;
  const extraRevs = Math.max(0, project.revisionsUsed - project.revisionsIncluded);

  return (
    <div
      onClick={onOpen}
      className={`group rounded-[24px] bg-white dark:bg-obsidian-900 border p-4 transition-all duration-200 cursor-pointer select-none ${
        isOverlay
          ? 'border-lime-accent shadow-2xl scale-[1.03] rotate-1 ring-2 ring-lime-accent/50'
          : 'border-slate-200/90 dark:border-white/10 hover:border-lime-accent/60 hover:-translate-y-0.5 shadow-xs hover:shadow-lg'
      }`}
    >
      {/* Alert Banner when missing client material */}
      {missingMaterial && (
        <div className="mb-2.5 flex items-center gap-1.5 rounded-xl bg-tangerine-accent/15 border border-tangerine-accent/30 px-2.5 py-1.5 text-[11px] font-bold text-tangerine-accent">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Falta material del cliente</span>
        </div>
      )}

      {/* Top Row: Tags + Drag Grip */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.priority === 'urgente' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-tangerine-accent px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              <Flame className="h-3 w-3" />
              Urgente
            </span>
          )}
          <span className="rounded-full bg-slate-100 dark:bg-obsidian-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {project.format}
          </span>
        </div>

        <div
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          title="Arrastrar tarjeta"
          className="touch-none p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-lime-accent cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      {/* Title & Client */}
      <h4 className="mt-2 font-display text-base font-bold leading-snug text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-lime-accent transition-colors">
        {project.title}
      </h4>
      <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
        {clientName}
      </p>

      {/* Progress Bar for Editor Tasks */}
      {editorTotal > 0 && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3 text-lime-accent" />
              Edición {editorDone}/{editorTotal}
            </span>
            <span>{editorPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-obsidian-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-lime-accent transition-all"
              style={{ width: `${editorPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Revisions & Due Date Row */}
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
          <Calendar className="h-3 w-3" />
          {format(parseISO(project.dueDate), 'd MMM', { locale: es })}
        </span>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
            extraRevs > 0
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : 'bg-violet-accent/15 text-violet-500 dark:text-violet-300'
          }`}
        >
          <RefreshCw className="h-2.5 w-2.5" />
          Rev {project.revisionsUsed}/{project.revisionsIncluded}
        </span>
      </div>

      {/* Footer: Payment Status + Touch Quick Column Selector */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              project.paymentStatus === 'pagado'
                ? 'bg-emerald-400'
                : project.paymentStatus === 'anticipo'
                ? 'bg-sky-400'
                : 'bg-orange-400'
            }`}
          />
          <span className="text-[11px] font-bold truncate text-slate-700 dark:text-slate-200">
            {currency}
            {project.price} •{' '}
            {project.paymentStatus === 'pagado'
              ? 'Pagado'
              : project.paymentStatus === 'anticipo'
              ? 'Anticipo'
              : 'Sin pagar'}
          </span>
        </div>

        {/* One-tap quick column switcher for effortless mobile use */}
        <div onClick={(e) => e.stopPropagation()}>
          <select
            aria-label="Cambiar columna"
            value={project.status}
            onChange={(e) => onQuickStatusChange(e.target.value as ProjectStatus)}
            className="rounded-xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-lime-accent focus:outline-none cursor-pointer"
          >
            {KANBAN_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.shortTitle}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const DraggableKanbanCard: React.FC<KanbanCardProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.project.id,
    data: { project: props.project },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCardContent
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const DroppableColumn: React.FC<{
  column: (typeof KANBAN_COLUMNS)[number];
  count: number;
  totalAmount: number;
  currency: string;
  onAddInColumn: (status: ProjectStatus) => void;
  children: React.ReactNode;
}> = ({ column, count, totalAmount, currency, onAddInColumn, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`snap-center shrink-0 w-[85vw] sm:w-[315px] flex flex-col rounded-[28px] p-3.5 border transition-colors min-h-[520px] ${
        isOver
          ? 'bg-lime-accent/10 border-lime-accent shadow-glow-lime'
          : 'bg-slate-200/55 dark:bg-obsidian-900/55 border-slate-200/80 dark:border-white/5'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between gap-2 px-1.5 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
            <h3 className="font-display text-sm font-bold truncate">
              {column.title}
            </h3>
            <span className="rounded-full bg-white dark:bg-obsidian-800 px-2 py-0.5 text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {count}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 pl-4.5">
            {column.subtitle} • {currency}
            {totalAmount.toLocaleString('es-ES')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddInColumn(column.id)}
          title={`Crear en ${column.title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-lime-accent hover:text-lime-accent transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards Stack */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">{children}</div>
    </div>
  );
};

export const KanbanView: React.FC<{
  onCreateInStatus: (status: ProjectStatus) => void;
}> = ({ onCreateInStatus }) => {
  const {
    projects,
    clients,
    settings,
    quickFilters,
    moveProjectStatus,
    setSelectedProjectId,
    hasMissingClientMaterial,
  } = useStudio();

  const [activeDragProject, setActiveDragProject] = useState<Project | null>(null);
  const [mobileColumnFilter, setMobileColumnFilter] = useState<'all' | ProjectStatus>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 170, tolerance: 8 },
    })
  );

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (quickFilters.onlyUrgent && p.priority !== 'urgente') return false;
      if (quickFilters.onlyPendingPayment && p.price <= p.amountPaid) return false;
      if (quickFilters.onlyMissingMaterial && !hasMissingClientMaterial(p)) return false;
      if (quickFilters.searchQuery.trim()) {
        const q = quickFilters.searchQuery.toLowerCase();
        const cli = clientMap.get(p.clientId);
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.format.toLowerCase().includes(q) ||
          cli?.name.toLowerCase().includes(q) ||
          cli?.company.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [projects, quickFilters, hasMissingClientMaterial, clientMap]);

  const handleDragStart = (event: DragStartEvent) => {
    const proj = event.active.data.current?.project as Project | undefined;
    if (proj) setActiveDragProject(proj);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragProject(null);
    const { active, over } = event;
    if (!over) return;

    const projectId = String(active.id);
    const newStatus = String(over.id) as ProjectStatus;

    if (KANBAN_COLUMNS.some((c) => c.id === newStatus)) {
      moveProjectStatus(projectId, newStatus);
    }
  };

  const visibleColumns =
    mobileColumnFilter === 'all'
      ? KANBAN_COLUMNS
      : KANBAN_COLUMNS.filter((c) => c.id === mobileColumnFilter);

  return (
    <div className="space-y-4">
      {/* Header + Mobile Column Quick Jump */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-lime-accent" />
            Flujo de Edición Kanban
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Arrastra tarjetas desde el ícono lateral o cambia la columna con un toque en el selector inferior.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreateInStatus('en_edicion')}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-2xl bg-lime-accent px-4 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover transition-colors"
        >
          <Plus className="h-4 w-4 stroke-[2.6]" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Mobile Quick Stage Filter Pills */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMobileColumnFilter('all')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            mobileColumnFilter === 'all'
              ? 'bg-lime-accent text-obsidian-950'
              : 'bg-white dark:bg-obsidian-900 text-slate-400 border border-white/10'
          }`}
        >
          Todas (6)
        </button>
        {KANBAN_COLUMNS.map((col) => {
          const cnt = filteredProjects.filter((p) => p.status === col.id).length;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileColumnFilter(col.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                mobileColumnFilter === col.id
                  ? 'bg-lime-accent text-obsidian-950'
                  : 'bg-white dark:bg-obsidian-900 text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              {col.shortTitle} ({cnt})
            </button>
          );
        })}
      </div>

      {/* Horizontal Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none">
          {visibleColumns.map((col) => {
            const colProjects = filteredProjects.filter((p) => p.status === col.id);
            const totalAmount = colProjects.reduce((s, p) => s + p.price, 0);

            return (
              <DroppableColumn
                key={col.id}
                column={col}
                count={colProjects.length}
                totalAmount={totalAmount}
                currency={settings.currency}
                onAddInColumn={onCreateInStatus}
              >
                {colProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 py-10 px-4 text-center">
                    <p className="text-xs text-slate-400">
                      Sin trabajos en {col.shortTitle.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  colProjects.map((proj) => {
                    const cli = clientMap.get(proj.clientId);
                    return (
                      <DraggableKanbanCard
                        key={proj.id}
                        project={proj}
                        clientName={
                          cli ? `${cli.name} • ${cli.company}` : 'Cliente sin asignar'
                        }
                        currency={settings.currency}
                        missingMaterial={hasMissingClientMaterial(proj)}
                        onOpen={() => setSelectedProjectId(proj.id)}
                        onQuickStatusChange={(st) => moveProjectStatus(proj.id, st)}
                      />
                    );
                  })
                )}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDragProject ? (
            <div className="w-[300px]">
              <KanbanCardContent
                project={activeDragProject}
                clientName={
                  clientMap.get(activeDragProject.clientId)?.name || 'Cliente'
                }
                currency={settings.currency}
                missingMaterial={hasMissingClientMaterial(activeDragProject)}
                onOpen={() => {}}
                onQuickStatusChange={() => {}}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
