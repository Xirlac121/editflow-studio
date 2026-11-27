import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { KANBAN_COLUMNS, Project } from '../types/studio';
import { buildClientPortalUrl } from '../lib/portalLink';

const AnimatedCount: React.FC<{ value: number; prefix?: string }> = ({
  value,
  prefix = '',
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 550;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <>
      {prefix}
      {display.toLocaleString('es-ES')}
    </>
  );
};

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
    hasSampleData,
    clearSampleData,
    showToast,
  } = useStudio();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

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

  const copyPortalFromCard = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const cli = clientMap.get(project.clientId);
    const url = buildClientPortalUrl(project, settings, cli?.name);
    await navigator.clipboard.writeText(url);
    showToast('🔗 Link de seguimiento del cliente copiado', 'success');
  };

  const monthlyTotal = metrics.collectedThisMonth + metrics.pendingToCollect;
  const collectedPct =
    monthlyTotal > 0 ? Math.round((metrics.collectedThisMonth / monthlyTotal) * 100) : 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* One-Click Demo Data Cleanup Banner */}
      {hasSampleData && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-violet-accent/20 via-obsidian-900 to-lime-accent/15 border border-violet-accent/35 px-5 py-3.5"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 text-lime-accent shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              <strong>Modo demostración activo:</strong> Tienes proyectos y clientes de ejemplo cargados.
            </span>
          </div>

          <button
            type="button"
            onClick={clearSampleData}
            className="inline-flex items-center gap-1.5 rounded-full bg-lime-accent px-4 py-1.5 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:scale-105 transition-transform"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Borrar ejemplos y empezar en limpio</span>
          </button>
        </motion.div>
      )}

      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
      >
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
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-accent" />
          </span>
          <span>Resumen de hoy • {formattedTodayPill}</span>
        </div>
      </motion.div>

      {/* =====================================================================
          4 MOTION GRAPHICS BENTO CARDS
      ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Entregas de esta semana */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, type: 'spring', stiffness: 320, damping: 26 }}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('calendar')}
          className="motion-shimmer group relative flex flex-col justify-between rounded-[28px] bg-lime-accent p-5 sm:p-6 text-left text-obsidian-950 shadow-glow-lime min-h-[192px] overflow-hidden"
        >
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-950 text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none">
              <AnimatedCount value={metrics.weekCount} />
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug max-w-[140px]">
              Entregas esta semana
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center rounded-full bg-obsidian-950 px-3.5 py-1.5 text-[11px] font-extrabold tracking-wider text-white uppercase">
            {formattedTodayPill}
          </div>
        </motion.button>

        {/* 2. Proyectos en edición */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 320, damping: 26 }}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('kanban')}
          className="motion-shimmer group relative flex flex-col justify-between rounded-[28px] bg-violet-accent p-5 sm:p-6 text-left text-white shadow-glow-violet min-h-[192px] overflow-hidden"
        >
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 38, ease: 'linear' }}
            className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 text-obsidian-950/25"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
          </motion.svg>

          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-obsidian-950 text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none text-white">
              <AnimatedCount value={metrics.inEditingCount} />
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
        </motion.button>

        {/* 3. Trabajos bloqueados */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, type: 'spring', stiffness: 320, damping: 26 }}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setQuickFilters((prev) => ({ ...prev, onlyMissingMaterial: true }));
            setActiveTab('kanban');
          }}
          className="group relative flex flex-col justify-between rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5 sm:p-6 text-left hover:border-tangerine-accent/60 min-h-[192px]"
        >
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-tangerine-accent/15 text-tangerine-accent transition-transform group-hover:scale-110">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              <AnimatedCount value={metrics.blockedCount} />
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug text-slate-700 dark:text-slate-200 max-w-[155px]">
              Trabajos bloqueados
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center gap-1.5 rounded-full bg-tangerine-accent px-3 py-1 text-[11px] font-bold text-white">
            <span>Falta material cliente</span>
          </div>
        </motion.button>

        {/* 4. Dinero por cobrar */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 320, damping: 26 }}
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('quotes')}
          className="group relative flex flex-col justify-between rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5 sm:p-6 text-left hover:border-lime-accent/50 min-h-[192px]"
        >
          <div className="absolute top-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-lime-accent/20 text-emerald-700 dark:text-lime-accent transition-transform group-hover:scale-110">
            <DollarSign className="h-5 w-5" />
          </div>

          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              <AnimatedCount
                value={metrics.pendingToCollect}
                prefix={settings.currency}
              />
            </span>
            <p className="mt-2.5 text-sm sm:text-base font-bold leading-snug text-slate-700 dark:text-slate-200">
              Dinero por cobrar
            </p>
          </div>

          <div className="mt-4 inline-flex self-start items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>Cobrado mes: {formatMoney(metrics.collectedThisMonth)}</span>
          </div>
        </motion.button>
      </div>

      {/* =====================================================================
          TWO-COLUMN WORKSPACE: PRIORITY TASKS + BLOCKED & BILLING PULSE
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Priority Tasks */}
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
            <div className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-10 text-center space-y-2">
              <p className="text-slate-400 text-sm font-semibold">
                Tu tablero está limpio. Usa el botón + abajo a la derecha para crear tu primer proyecto real.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {priorityProjects.map((project, idx) => {
                const client = clientMap.get(project.clientId);
                const col = KANBAN_COLUMNS.find((c) => c.id === project.status);
                const missingMat = hasMissingClientMaterial(project);
                const editorDone = project.editorChecklist.filter((i) => i.completed).length;
                const editorTotal = project.editorChecklist.length;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + idx * 0.04 }}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedProjectId(project.id)}
                    className="group cursor-pointer rounded-[26px] bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-obsidian-800/95 border border-slate-200/90 dark:border-white/10 hover:border-lime-accent/50 p-5 transition-colors shadow-xs"
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => copyPortalFromCard(e, project)}
                          title="Copiar link público del cliente"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-obsidian-800 text-slate-500 dark:text-lime-accent hover:scale-110 transition-transform"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                            project.priority === 'urgente'
                              ? 'bg-tangerine-accent text-white'
                              : 'bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Entrega {format(parseISO(project.dueDate), 'd MMM', { locale: es })}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {client ? `${client.name} (${client.company}) — ` : ''}
                      {project.description || 'Toca para abrir checklists, plantillas WhatsApp y recibo'}
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 cols: Monthly Revenue Pulse + Missing Client Material Alerts */}
        <div className="lg:col-span-5 space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6"
          >
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${collectedPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full bg-lime-accent shadow-glow-lime"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};
