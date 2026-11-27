import React, { useMemo } from 'react';
import {
  addDays,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  DollarSign,
  Film,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { KANBAN_COLUMNS, Project } from '../types/studio';

export const DashboardView: React.FC = () => {
  const {
    settings,
    projects,
    clients,
    setActiveTab,
    setSelectedProjectId,
    setQuickFilters,
    quickFilters,
    hasMissingClientMaterial,
  } = useStudio();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  // Apply global quick filters when active
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

  // 4 Essential Metrics
  const metrics = useMemo(() => {
    const thisWeekDeliveries = projects.filter((p) => {
      if (p.status === 'entregado' || p.status === 'por_cotizar') return false;
      try {
        const due = parseISO(p.dueDate);
        return isWithinInterval(due, { start: addDays(weekStart, -1), end: weekEnd });
      } catch {
        return false;
      }
    });

    const inEditing = projects.filter(
      (p) => p.status === 'en_edicion' || p.status === 'ajustes'
    );

    const blockedMissingMaterial = projects.filter((p) =>
      hasMissingClientMaterial(p)
    );

    const activeBillable = projects.filter((p) => p.status !== 'por_cotizar');
    const pendingToCollect = activeBillable.reduce(
      (sum, p) => sum + Math.max(0, p.price - p.amountPaid),
      0
    );

    const collectedThisMonth = activeBillable
      .filter((p) => {
        try {
          return isSameMonth(parseISO(p.dueDate), today);
        } catch {
          return true;
        }
      })
      .reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      weekCount: thisWeekDeliveries.length,
      inEditingCount: inEditing.length,
      blockedCount: blockedMissingMaterial.length,
      pendingToCollect,
      collectedThisMonth,
      blockedList: blockedMissingMaterial,
    };
  }, [projects, weekStart, weekEnd, hasMissingClientMaterial]);

  // Priority / Upcoming active tasks sorted by urgency & due date
  const priorityProjects = useMemo(() => {
    return [...filteredProjects]
      .filter((p) => p.status !== 'entregado')
      .sort((a, b) => {
        if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
        if (b.priority === 'urgente' && a.priority !== 'urgente') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 6);
  }, [filteredProjects]);

  const formattedTodayPill = format(today, 'EEE.dd.MMM', { locale: es }).toUpperCase();

  const formatMoney = (amount: number) =>
    `${settings.currency}${amount.toLocaleString('es-ES')}`;

  const openWhatsAppReminder = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const client = clientMap.get(project.clientId);
    const missingItems = project.clientChecklist
      .filter((i) => !i.completed)
      .map((i) => i.label)
      .join(', ');
    const text = encodeURIComponent(
      `Hola ${client?.name || ''} 👋 Te escribo por el proyecto "${project.title}". Para avanzar con la edición quedo atento a: ${
        missingItems || 'archivos pendientes'
      }. ¡Gracias!`
    );
    const cleanPhone = (client?.phone || '').replace(/[^\d]/g, '');
    window.open(
      cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`,
      '_blank'
    );
  };

  const monthlyTotal = metrics.collectedThisMonth + metrics.pendingToCollect;
  const collectedPct =
    monthlyTotal > 0 ? Math.round((metrics.collectedThisMonth / monthlyTotal) * 100) : 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Greeting Header (Inspired directly by reference image) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Hola, {settings.editorName}
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Tienes{' '}
            <strong className="text-slate-900 dark:text-lime-accent">
              {metrics.weekCount} entregas programadas
            </strong>{' '}
            para esta semana
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-lime-accent" />
          <span>Resumen de hoy • {formattedTodayPill}</span>
        </div>
      </div>

      {/* =====================================================================
          4 METRIC BENTO CARDS (Inspired by Reference Scalloped / Bold Cards)
      ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Entregas de esta semana — Electric Lime Hero Card */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className="group relative flex flex-col justify-between rounded-[28px] bg-lime-accent p-5 sm:p-6 text-left text-obsidian-950 shadow-glow-lime transition-transform hover:-translate-y-0.5 min-h-[190px] overflow-hidden"
        >
          {/* Top-right notched circular action button */}
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-950 text-white transition-transform group-hover:scale-105">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none">
              {metrics.weekCount}
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug max-w-[140px]">
              Entregas esta semana
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center rounded-full bg-obsidian-950 px-3.5 py-1.5 text-[11px] font-extrabold tracking-wider text-white uppercase">
            {formattedTodayPill}
          </div>
        </button>

        {/* 2. Proyectos en edición — Electric Violet Hero Card */}
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className="group relative flex flex-col justify-between rounded-[28px] bg-violet-accent p-5 sm:p-6 text-left text-white shadow-glow-violet transition-transform hover:-translate-y-0.5 min-h-[190px] overflow-hidden"
        >
          {/* Decorative dashed arc like reference image */}
          <svg
            className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-36 text-obsidian-950/25"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="5 5"
            />
          </svg>

          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-950 text-white transition-transform group-hover:scale-105">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none text-white">
              {metrics.inEditingCount}
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug text-white/95 max-w-[140px]">
              Proyectos en edición
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-obsidian-950/25 px-3 py-1 text-[11px] font-bold">
              En timeline
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-obsidian-950 text-lime-accent">
              <Check className="h-4 w-4 stroke-[3]" />
            </span>
          </div>
        </button>

        {/* 3. Trabajos bloqueados (Falta material) */}
        <button
          type="button"
          onClick={() => {
            setQuickFilters((prev) => ({ ...prev, onlyMissingMaterial: true }));
            setActiveTab('kanban');
          }}
          className="group relative flex flex-col justify-between rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5 sm:p-6 text-left transition-transform hover:-translate-y-0.5 hover:border-tangerine-accent/60 min-h-[190px]"
        >
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-tangerine-accent/15 text-tangerine-accent transition-transform group-hover:scale-105">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              {metrics.blockedCount}
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug text-slate-700 dark:text-slate-200 max-w-[155px]">
              Trabajos bloqueados
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center gap-1.5 rounded-full bg-tangerine-accent px-3 py-1 text-[11px] font-bold text-white">
            <span>Falta material cliente</span>
          </div>
        </button>

        {/* 4. Dinero por cobrar */}
        <button
          type="button"
          onClick={() => setActiveTab('quotes')}
          className="group relative flex flex-col justify-between rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5 sm:p-6 text-left transition-transform hover:-translate-y-0.5 hover:border-lime-accent/50 min-h-[190px]"
        >
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-lime-accent/20 text-emerald-700 dark:text-lime-accent transition-transform group-hover:scale-105">
            <DollarSign className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              {formatMoney(metrics.pendingToCollect)}
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug text-slate-700 dark:text-slate-200">
              Dinero por cobrar
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>Cobrado mes: {formatMoney(metrics.collectedThisMonth)}</span>
          </div>
        </button>
      </div>

      {/* =====================================================================
          TWO-COLUMN WORKSPACE: PRIORITY TASKS + BLOCKED & BILLING PULSE
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Priority Tasks (Styled directly after Reference Priority Tasks) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian-800 border border-lime-accent/40 text-xs font-extrabold text-lime-accent">
                {priorityProjects.length}
              </span>
              <h3 className="font-display text-xl font-bold">
                Entregas Prioritarias
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className="text-xs font-bold text-slate-500 dark:text-lime-accent hover:underline"
            >
              Abrir Kanban completo →
            </button>
          </div>

          {priorityProjects.length === 0 ? (
            <div className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-8 text-center">
              <p className="text-slate-400 text-sm">
                No hay entregas activas con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {priorityProjects.map((project) => {
                const client = clientMap.get(project.clientId);
                const col = KANBAN_COLUMNS.find((c) => c.id === project.status);
                const missingMat = hasMissingClientMaterial(project);
                const editorDone = project.editorChecklist.filter((i) => i.completed).length;
                const editorTotal = project.editorChecklist.length;

                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className="group cursor-pointer rounded-[26px] bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-obsidian-800/95 border border-slate-200/90 dark:border-white/10 hover:border-lime-accent/50 p-5 transition-all shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-obsidian-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <Film className="h-3 w-3 text-lime-accent" />
                            {project.format}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                              col?.badgeBg || ''
                            }`}
                          >
                            {col?.shortTitle}
                          </span>

                          {missingMat && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-bold text-red-500 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              Falta material
                            </span>
                          )}
                        </div>

                        <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-lime-accent transition-colors">
                          {project.title}
                        </h4>
                      </div>

                      {/* Due pill (Warm Orange for Urgent like reference "Due 11:30am") */}
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                          project.priority === 'urgente'
                            ? 'bg-tangerine-accent text-white'
                            : 'bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Entrega {format(parseISO(project.dueDate), 'd MMM', { locale: es })}
                        {project.dueTime ? ` • ${project.dueTime}` : ''}
                      </span>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {client ? `${client.name} (${client.company}) — ` : ''}
                      {project.description || 'Sin descripción adicional'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Tareas edición:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {editorDone}/{editorTotal}
                          </strong>
                        </span>
                        <span
                          className={`font-semibold ${
                            project.revisionsUsed > project.revisionsIncluded
                              ? 'text-red-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Revisión {project.revisionsUsed} de {project.revisionsIncluded}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            project.paymentStatus === 'pagado'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : project.paymentStatus === 'anticipo'
                              ? 'bg-sky-500/15 text-sky-400'
                              : 'bg-orange-500/15 text-orange-400'
                          }`}
                        >
                          {project.paymentStatus === 'pagado'
                            ? 'Pagado'
                            : project.paymentStatus === 'anticipo'
                            ? `Anticipo (${formatMoney(project.amountPaid)})`
                            : 'Sin pagar'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatMoney(project.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 cols: Monthly Revenue Pulse + Missing Client Material Alerts */}
        <div className="lg:col-span-5 space-y-5">
          {/* Monthly Billing Card */}
          <div className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">
                Pulso de Cobros del Mes
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-lime-accent bg-obsidian-800 px-3 py-1 rounded-full">
                {format(today, 'MMMM', { locale: es })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Cobrado
                </span>
                <p className="mt-1 font-display text-2xl font-extrabold text-emerald-500">
                  {formatMoney(metrics.collectedThisMonth)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Por cobrar
                </span>
                <p className="mt-1 font-display text-2xl font-extrabold text-tangerine-accent">
                  {formatMoney(metrics.pendingToCollect)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  Progreso de recuperación
                </span>
                <span>{collectedPct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-obsidian-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-accent transition-all duration-500"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pending Material from Clients (1-click WhatsApp nudge) */}
          <div className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-tangerine-accent" />
                <h3 className="font-display text-lg font-bold">
                  Pendientes del Cliente
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {metrics.blockedList.length} proyectos
              </span>
            </div>

            {metrics.blockedList.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                ¡Todo el material de clientes está completo! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.blockedList.slice(0, 4).map((proj) => {
                  const cli = clientMap.get(proj.clientId);
                  const missingItems = proj.clientChecklist.filter(
                    (i) => !i.completed
                  );
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="cursor-pointer rounded-2xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-white/5 p-3.5 hover:border-tangerine-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {proj.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {cli?.name || 'Cliente'} • Faltan{' '}
                            {missingItems.length || 1} archivos
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => openWhatsAppReminder(e, proj)}
                          title="Pedir material por WhatsApp"
                          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-bold text-emerald-500 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Pedir</span>
                        </button>
                      </div>
                      {missingItems.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {missingItems.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-lg bg-tangerine-accent/15 px-2 py-0.5 text-[10px] font-semibold text-tangerine-accent"
                            >
                              • {item.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
