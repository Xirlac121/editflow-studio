import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  fromDbClient,
  fromDbProject,
  fromDbSettings,
  getStoredCloudCredentials,
} from '../lib/supabase';
import {
  decodeBase64Url,
  PortalCloudToken,
  PortalSnapshotFallback,
} from '../lib/portalLink';
import { KANBAN_COLUMNS, Project, ProjectStatus } from '../types/studio';

const PORTAL_STEPS: { id: ProjectStatus; label: string; desc: string }[] = [
  { id: 'por_cotizar', label: 'En Cola', desc: 'Propuesta / Reserva' },
  { id: 'esperando_material', label: 'Material', desc: 'Recibiendo archivos' },
  { id: 'en_edicion', label: 'En Edición', desc: 'Trabajando en timeline' },
  { id: 'en_revision', label: 'En Revisión', desc: 'Listo para tu feedback' },
  { id: 'ajustes', label: 'Ajustes', desc: 'Aplicando cambios' },
  { id: 'entregado', label: 'Entregado', desc: 'Proyecto finalizado' },
];

interface ClientPortalViewProps {
  projectId: string;
  previewData?: {
    project: Project;
    studioName: string;
    editorName: string;
    currency: string;
    clientName?: string;
    onExitPreview: () => void;
  };
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  projectId,
  previewData,
}) => {
  const [project, setProject] = useState<Project | null>(
    previewData?.project || null
  );
  const [studioName, setStudioName] = useState(
    previewData?.studioName || 'CutFlow Studio'
  );
  const [editorName, setEditorName] = useState(
    previewData?.editorName || 'Editor'
  );
  const [currency, setCurrency] = useState(previewData?.currency || '$');
  const [clientName, setClientName] = useState(previewData?.clientName || '');
  const [loading, setLoading] = useState(!previewData);
  const [isLiveRealtime, setIsLiveRealtime] = useState(false);

  // Sync live when opened via public URL (?portal=...)
  useEffect(() => {
    if (previewData) {
      setProject(previewData.project);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const encodedCloud = params.get('c');
    const encodedSnap = params.get('d');

    if (encodedSnap) {
      const snap = decodeBase64Url<PortalSnapshotFallback>(encodedSnap);
      if (snap?.project) {
        setProject(snap.project);
        setStudioName(snap.studioName);
        setEditorName(snap.editorName);
        setCurrency(snap.currency);
        if (snap.clientName) setClientName(snap.clientName);
        setLoading(false);
      }
    }

    let sbUrl = '';
    let sbKey = '';

    if (encodedCloud) {
      const decoded = decodeBase64Url<PortalCloudToken>(encodedCloud);
      if (decoded?.u && decoded?.k) {
        sbUrl = decoded.u;
        sbKey = decoded.k;
      }
    } else {
      const localCreds = getStoredCloudCredentials();
      sbUrl = localCreds.url;
      sbKey = localCreds.anonKey;
    }

    if (!sbUrl || !sbKey) {
      setLoading(false);
      return;
    }

    const supabase = createClient(sbUrl, sbKey);
    let cancelled = false;

    async function fetchPortalProject() {
      try {
        const [projRes, setRes] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
          supabase.from('studio_settings').select('*').eq('id', 'main').maybeSingle(),
        ]);

        if (cancelled) return;

        if (setRes.data) {
          const parsedSet = fromDbSettings(setRes.data);
          setStudioName(parsedSet.studioName);
          setEditorName(parsedSet.editorName);
          setCurrency(parsedSet.currency);
        }

        if (projRes.data) {
          const parsedProj = fromDbProject(projRes.data);
          setProject(parsedProj);
          setIsLiveRealtime(true);

          if (parsedProj.clientId) {
            const cliRes = await supabase
              .from('clients')
              .select('*')
              .eq('id', parsedProj.clientId)
              .maybeSingle();
            if (!cancelled && cliRes.data) {
              const cli = fromDbClient(cliRes.data);
              setClientName(cli.name);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPortalProject();

    const channel = supabase
      .channel(`portal-live-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.new) {
            setProject(fromDbProject(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [projectId, previewData]);

  const activeStepIdx = useMemo(() => {
    if (!project) return 0;
    const idx = PORTAL_STEPS.findIndex((s) => s.id === project.status);
    return idx === -1 ? 0 : idx;
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian-950 text-white p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          className="h-12 w-12 rounded-2xl border-2 border-lime-accent border-t-transparent"
        />
        <p className="mt-4 text-sm font-semibold text-slate-400">
          Cargando estado en vivo del proyecto...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian-950 text-white p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-obsidian-800 text-tangerine-accent mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          Enlace de seguimiento no encontrado
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Es posible que el proyecto haya sido archivado o que el enlace esté incompleto. Solicita un enlace actualizado a tu editor.
        </p>
      </div>
    );
  }

  const editorDone = project.editorChecklist.filter((i) => i.completed).length;
  const editorTotal = project.editorChecklist.length;
  const editorPct =
    project.status === 'entregado'
      ? 100
      : editorTotal > 0
      ? Math.round((editorDone / editorTotal) * 100)
      : Math.round(((activeStepIdx + 1) / PORTAL_STEPS.length) * 100);

  const missingClientItems = project.clientChecklist.filter((i) => !i.completed);
  const currentCol = KANBAN_COLUMNS.find((c) => c.id === project.status);
  const pendingAmount = Math.max(0, project.price - project.amountPaid);

  const openUrl = (u?: string) => {
    if (!u) return;
    window.open(u.startsWith('http') ? u : `https://${u}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-screen bg-obsidian-950 text-white overflow-x-hidden selection:bg-lime-accent selection:text-obsidian-950">
      {/* Ambient Motion Graphics Orbs */}
      <div className="pointer-events-none fixed -top-36 -left-24 h-96 w-96 rounded-full bg-lime-accent/15 blur-[130px] animate-orb-slow" />
      <div className="pointer-events-none fixed top-1/3 -right-28 h-96 w-96 rounded-full bg-violet-accent/15 blur-[130px] animate-orb-reverse" />

      {/* Editor Preview Banner */}
      {previewData && (
        <div className="sticky top-0 z-50 bg-lime-accent text-obsidian-950 px-4 py-2.5 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Vista Previa del Cliente (Solo lectura • Sin acceso a tus demás proyectos)
            </span>
            <button
              type="button"
              onClick={previewData.onExitPreview}
              className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-950 text-white px-3.5 py-1 text-xs font-bold hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al Estudio
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Top Studio Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950 shadow-glow-lime">
              <Film className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-lime-accent">
                Portal de Seguimiento
              </p>
              <h2 className="font-display text-lg font-bold">{studioName}</h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-obsidian-900/90 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-accent" />
            </span>
            <span>
              {isLiveRealtime || previewData
                ? 'Sincronizado en tiempo real'
                : 'Estado del proyecto'}
            </span>
          </div>
        </motion.div>

        {/* Hero Project Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="rounded-[32px] bg-obsidian-900/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="timeline-ruler-bg absolute inset-x-0 top-0 h-3 opacity-60" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-lime-accent text-obsidian-950 px-3 py-1 text-xs font-extrabold">
                  {currentCol?.title}
                </span>
                <span className="rounded-full bg-obsidian-800 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  {project.format}
                </span>
                {clientName && (
                  <span className="text-xs font-semibold text-slate-400">
                    Para: <strong className="text-white">{clientName}</strong>
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {project.title}
              </h1>

              {project.description && (
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              )}
            </div>

            {/* Animated Circular Progress */}
            <div className="flex items-center gap-4 rounded-3xl bg-obsidian-800/90 border border-white/10 px-5 py-4">
              <div className="relative h-16 w-16 flex items-center justify-center">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#D9F950"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ strokeDasharray: '0 164' }}
                    animate={{
                      strokeDasharray: `${(editorPct / 100) * 163.36} 164`,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <span className="absolute font-display text-sm font-extrabold text-lime-accent">
                  {editorPct}%
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Avance Total</p>
                <p className="font-display text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-4 w-4 text-lime-accent" />
                  {format(parseISO(project.dueDate), 'd MMM yyyy', { locale: es })}
                </p>
                <p className="text-[11px] text-slate-400">Fecha estimada entrega</p>
              </div>
            </div>
          </div>

          {/* 6-Stage Motion Timeline Stepper */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {PORTAL_STEPS.map((step, idx) => {
                const completed = idx < activeStepIdx || project.status === 'entregado';
                const current = idx === activeStepIdx && project.status !== 'entregado';
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06 }}
                    className={`rounded-2xl p-3 border transition-all ${
                      current
                        ? 'bg-lime-accent text-obsidian-950 border-lime-accent shadow-glow-lime'
                        : completed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-obsidian-800/50 border-white/5 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase">
                        Paso {idx + 1}
                      </span>
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : current ? (
                        <Clock className="h-4 w-4 animate-pulse" />
                      ) : null}
                    </div>
                    <p className="font-display text-xs font-extrabold truncate">
                      {step.label}
                    </p>
                    <p
                      className={`text-[10px] truncate ${
                        current ? 'text-obsidian-950/80 font-semibold' : 'opacity-75'
                      }`}
                    >
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Quick Deliverable & Review Links (Shown only when links are filled) */}
        {(project.links.frameio || project.links.drive || project.links.wetransfer) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
          >
            {project.links.frameio && (
              <button
                type="button"
                onClick={() => openUrl(project.links.frameio)}
                className="motion-shimmer flex items-center justify-between rounded-3xl bg-violet-accent p-5 text-left text-white shadow-glow-violet hover:scale-[1.01] transition-transform"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full">
                    Revisión de Video
                  </span>
                  <p className="mt-2 font-display text-base font-extrabold">
                    Ver Avance en Frame.io
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 shrink-0" />
              </button>
            )}

            {project.links.drive && (
              <button
                type="button"
                onClick={() => openUrl(project.links.drive)}
                className="motion-shimmer flex items-center justify-between rounded-3xl bg-lime-accent p-5 text-left text-obsidian-950 shadow-glow-lime hover:scale-[1.01] transition-transform"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-obsidian-950/15 px-2.5 py-0.5 rounded-full">
                    Google Drive
                  </span>
                  <p className="mt-2 font-display text-base font-extrabold">
                    Abrir Carpeta de Archivos
                  </p>
                </div>
                <FolderOpen className="h-5 w-5 shrink-0" />
              </button>
            )}

            {project.links.wetransfer && (
              <button
                type="button"
                onClick={() => openUrl(project.links.wetransfer)}
                className="flex items-center justify-between rounded-3xl bg-obsidian-900 border border-white/15 p-5 text-left text-white hover:border-lime-accent transition-colors"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime-accent">
                    Descarga Directa
                  </span>
                  <p className="mt-2 font-display text-base font-extrabold">
                    Abrir WeTransfer
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 shrink-0 text-lime-accent" />
              </button>
            )}
          </motion.div>
        )}

        {/* Dual Status Cards: Client Material + Editing Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client Material Status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-[28px] bg-obsidian-900/90 border border-white/10 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold flex items-center gap-2">
                {missingClientItems.length > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-tangerine-accent" />
                    <span>Material Requerido del Cliente</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>Material del Cliente Completo</span>
                  </>
                )}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {project.clientChecklist.length - missingClientItems.length}/
                {project.clientChecklist.length}
              </span>
            </div>

            {missingClientItems.length > 0 && (
              <div className="rounded-2xl bg-tangerine-accent/15 border border-tangerine-accent/30 p-3 text-xs font-semibold text-tangerine-accent">
                Para avanzar sin retrasos en la entrega, queda pendiente enviar los elementos sin marcar abajo:
              </div>
            )}

            <div className="space-y-2">
              {project.clientChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-obsidian-800/70 border border-white/5 px-3.5 py-2.5"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.completed
                        ? 'bg-emerald-400 text-obsidian-950'
                        : 'bg-tangerine-accent/20 border border-tangerine-accent text-tangerine-accent'
                    }`}
                  >
                    {item.completed ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-tangerine-accent" />
                    )}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      item.completed ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Post-production Checklist Progress */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[28px] bg-obsidian-900/90 border border-white/10 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lime-accent" />
                <span>Etapas de Postproducción</span>
              </h3>
              <span className="text-xs font-bold text-lime-accent">
                {editorDone}/{editorTotal} completadas
              </span>
            </div>

            <div className="space-y-2">
              {project.editorChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl bg-obsidian-800/70 border border-white/5 px-3.5 py-2.5"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.completed
                        ? 'bg-lime-accent text-obsidian-950'
                        : 'border border-white/20 text-slate-500'
                    }`}
                  >
                    {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      item.completed ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Revisions & Financial Summary Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="rounded-[26px] bg-obsidian-900/90 border border-white/10 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-accent/20 text-violet-300">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">
                  Rondas de Revisión
                </p>
                <p className="font-display text-base font-extrabold">
                  {project.revisionsUsed} de {project.revisionsIncluded} utilizadas
                </p>
              </div>
            </div>
            <span className="rounded-full bg-obsidian-800 px-3 py-1 text-xs font-bold text-violet-300">
              {Math.max(0, project.revisionsIncluded - project.revisionsUsed)} disponibles
            </span>
          </div>

          <div className="rounded-[26px] bg-obsidian-900/90 border border-white/10 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold">
                Resumen de Pago
              </p>
              <p className="font-display text-base font-extrabold">
                Abonado: {currency}
                {project.amountPaid.toLocaleString('es-ES')}{' '}
                <span className="text-slate-400 font-normal">
                  / {currency}
                  {project.price.toLocaleString('es-ES')}
                </span>
              </p>
            </div>
            <span
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold ${
                pendingAmount === 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-tangerine-accent/20 text-tangerine-accent'
              }`}
            >
              {pendingAmount === 0
                ? '✓ Pagado 100%'
                : `Restante: ${currency}${pendingAmount.toLocaleString('es-ES')}`}
            </span>
          </div>
        </motion.div>

        <footer className="pt-4 text-center text-xs text-slate-500">
          Editado por <strong className="text-slate-300">{editorName}</strong> •{' '}
          {studioName}
        </footer>
      </div>
    </div>
  );
};
