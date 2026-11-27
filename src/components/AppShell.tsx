import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  CalendarOff,
  Cloud,
  CloudOff,
  DollarSign,
  FileText,
  Film,
  Flame,
  FolderKanban,
  Home,
  Lock,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { ActiveTab, KANBAN_COLUMNS } from '../types/studio';

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}[] = [
  { id: 'dashboard', label: 'Resumen de hoy', shortLabel: 'Inicio', icon: Home },
  { id: 'kanban', label: 'Tablero Kanban', shortLabel: 'Kanban', icon: FolderKanban },
  { id: 'calendar', label: 'Calendario', shortLabel: 'Agenda', icon: Calendar },
  { id: 'clients', label: 'Clientes (CRM)', shortLabel: 'Clientes', icon: Users },
  { id: 'quotes', label: 'Cotizador y Pagos', shortLabel: 'Cotizar', icon: FileText },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    settings,
    updateSettings,
    activeTab,
    setActiveTab,
    lockNow,
    quickFilters,
    setQuickFilters,
    projects,
    clients,
    quotes,
    setSelectedProjectId,
    setQuickCreateModal,
    syncStatus,
    toasts,
    hasMissingClientMaterial,
  } = useStudio();

  const [fabOpen, setFabOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const searchResults = useMemo(() => {
    const q = quickFilters.searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedProjects = projects
      .filter((p) => {
        const cli = clientMap.get(p.clientId);
        return (
          p.title.toLowerCase().includes(q) ||
          p.format.toLowerCase().includes(q) ||
          cli?.name.toLowerCase().includes(q) ||
          cli?.company.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);

    const matchedClients = clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 4);

    const matchedQuotes = quotes
      .filter(
        (qt) =>
          qt.title.toLowerCase().includes(q) ||
          qt.number.toLowerCase().includes(q) ||
          qt.clientNameSnapshot.toLowerCase().includes(q)
      )
      .slice(0, 4);

    return { matchedProjects, matchedClients, matchedQuotes };
  }, [quickFilters.searchQuery, projects, clients, quotes, clientMap]);

  const urgentCount = useMemo(
    () => projects.filter((p) => p.priority === 'urgente' && p.status !== 'entregado').length,
    [projects]
  );

  const pendingPayCount = useMemo(
    () => projects.filter((p) => p.price > p.amountPaid && p.status !== 'por_cotizar').length,
    [projects]
  );

  const missingMatCount = useMemo(
    () => projects.filter((p) => hasMissingClientMaterial(p)).length,
    [projects, hasMissingClientMaterial]
  );

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className="relative min-h-screen flex bg-slate-100 text-slate-900 dark:bg-obsidian-950 dark:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Subtle Ambient Motion Graphics Orbs */}
      <div className="pointer-events-none fixed -top-44 right-1/4 h-96 w-96 rounded-full bg-lime-accent/[0.07] blur-[130px] animate-orb-slow z-0" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full bg-violet-accent/[0.08] blur-[140px] animate-orb-reverse z-0" />

      {/* =====================================================================
          DESKTOP FIXED SIDEBAR
      ===================================================================== */}
      <aside className="hidden lg:flex lg:w-68 xl:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white/95 dark:bg-obsidian-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 z-30 select-none">
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.06 }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950 shadow-glow-lime"
            >
              <Film className="h-6 w-6 stroke-[2.4]" />
            </motion.div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight tracking-tight">
                {settings.studioName}
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Motion & Video Suite
              </span>
            </div>
          </div>
        </div>

        {/* Cloud Sync Pill */}
        <div className="px-5 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold border transition-all ${
              syncStatus === 'cloud_live'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : syncStatus === 'connecting'
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-500'
                : syncStatus === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/15'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              {syncStatus === 'cloud_live' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>Supabase en vivo (PC + Móvil)</span>
                </>
              ) : syncStatus === 'connecting' ? (
                <>
                  <Cloud className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>Sincronizando nube...</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4 shrink-0" />
                  <span>Conectar Nube (Supabase)</span>
                </>
              )}
            </span>
            <span className="text-[10px] underline opacity-80">Config</span>
          </button>
        </div>

        {/* Main Navigation with Shared Spring Active Pill */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'text-obsidian-950 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="desktopActiveNavPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-2xl bg-lime-accent shadow-glow-lime"
                  />
                )}
                <Icon
                  className={`relative z-10 h-5 w-5 ${
                    active ? 'stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`relative w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'text-obsidian-950 font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="desktopActiveNavPill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-2xl bg-lime-accent shadow-glow-lime"
                />
              )}
              <Settings className="relative z-10 h-5 w-5" />
              <span className="relative z-10">Ajustes y Respaldo</span>
            </button>
          </div>
        </nav>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-obsidian-800 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-obsidian-700 transition-colors"
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-lime-accent" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-violet-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={lockNow}
              title="Bloqueo rápido con PIN"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 text-white dark:bg-obsidian-800 dark:hover:bg-red-500/20 dark:hover:text-red-300 border border-transparent dark:border-white/10 px-3.5 py-2.5 text-xs font-semibold transition-colors"
            >
              <Lock className="h-4 w-4 text-lime-accent" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN CONTENT AREA
      ===================================================================== */}
      <div className="relative z-10 flex-1 flex flex-col lg:pl-72 min-w-0">
        <header className="sticky top-0 z-20 bg-slate-100/85 dark:bg-obsidian-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex lg:hidden items-center gap-2.5 shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950 font-display font-bold shadow-glow-lime">
                  {settings.editorName.slice(0, 1).toUpperCase()}
                </div>
              </div>

              {/* Global Search Input */}
              <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={quickFilters.searchQuery}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(e) => {
                      setQuickFilters((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                      }));
                      setSearchOpen(true);
                    }}
                    placeholder="Buscar proyecto, cliente o cotización..."
                    className="w-full rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-lime-accent dark:focus:border-lime-accent transition-colors"
                  />
                  {quickFilters.searchQuery && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuickFilters((prev) => ({ ...prev, searchQuery: '' }))
                      }
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {searchOpen && searchResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-0 right-0 mt-2 rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/15 shadow-2xl p-3 z-50 max-h-[70vh] overflow-y-auto"
                    >
                      {searchResults.matchedProjects.length === 0 &&
                      searchResults.matchedClients.length === 0 &&
                      searchResults.matchedQuotes.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">
                          Sin resultados para "{quickFilters.searchQuery}"
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {searchResults.matchedProjects.length > 0 && (
                            <div>
                              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Proyectos
                              </p>
                              {searchResults.matchedProjects.map((p) => {
                                const col = KANBAN_COLUMNS.find(
                                  (c) => c.id === p.status
                                );
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedProjectId(p.id);
                                      setSearchOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate">
                                        {p.title}
                                      </p>
                                      <p className="text-xs text-slate-400 truncate">
                                        {clientMap.get(p.clientId)?.name || 'Sin cliente'} •{' '}
                                        {p.format}
                                      </p>
                                    </div>
                                    <span className="ml-2 shrink-0 rounded-full bg-obsidian-800 px-2.5 py-0.5 text-[11px] font-medium text-lime-accent">
                                      {col?.shortTitle}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {searchResults.matchedClients.length > 0 && (
                            <div>
                              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Clientes
                              </p>
                              {searchResults.matchedClients.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('clients');
                                    setSearchOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
                                >
                                  <div>
                                    <p className="text-sm font-semibold">{c.name}</p>
                                    <p className="text-xs text-slate-400">{c.company}</p>
                                  </div>
                                  <span className="text-xs text-violet-400 font-semibold">
                                    Ver ficha →
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchResults.matchedQuotes.length > 0 && (
                            <div>
                              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Cotizaciones
                              </p>
                              {searchResults.matchedQuotes.map((qt) => (
                                <button
                                  key={qt.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('quotes');
                                    setSearchOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                      {qt.number} — {qt.title}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                      {qt.clientNameSnapshot}
                                    </p>
                                  </div>
                                  <span className="text-xs text-lime-accent font-semibold">
                                    Cotización →
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Header Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  title={
                    syncStatus === 'cloud_live'
                      ? 'Sincronizado con Supabase Cloud'
                      : 'Configurar Supabase Cloud'
                  }
                  className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                    syncStatus === 'cloud_live'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                  }`}
                >
                  {syncStatus === 'cloud_live' ? (
                    <Cloud className="h-4 w-4" />
                  ) : (
                    <CloudOff className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Cambiar tema"
                  className="lg:hidden flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
                >
                  {settings.theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-lime-accent" />
                  ) : (
                    <Moon className="h-4 w-4 text-violet-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={lockNow}
                  title="Bloqueo rápido"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-lime-accent/50"
                >
                  <Lock className="h-4 w-4 text-lime-accent" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  title="Ajustes"
                  className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-lime-accent text-obsidian-950 border-lime-accent'
                      : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Filter Pills Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() =>
                  setQuickFilters((prev) => ({ ...prev, onlyUrgent: !prev.onlyUrgent }))
                }
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  quickFilters.onlyUrgent
                    ? 'bg-tangerine-accent text-white border-tangerine-accent shadow-sm'
                    : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-tangerine-accent/50'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Solo urgentes ({urgentCount})</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuickFilters((prev) => ({
                    ...prev,
                    onlyPendingPayment: !prev.onlyPendingPayment,
                  }))
                }
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  quickFilters.onlyPendingPayment
                    ? 'bg-lime-accent text-obsidian-950 border-lime-accent font-bold'
                    : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-lime-accent/50'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Pendientes de cobro ({pendingPayCount})</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuickFilters((prev) => ({
                    ...prev,
                    onlyMissingMaterial: !prev.onlyMissingMaterial,
                  }))
                }
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  quickFilters.onlyMissingMaterial
                    ? 'bg-violet-accent text-obsidian-950 border-violet-accent font-bold'
                    : 'bg-white dark:bg-obsidian-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-accent/50'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Falta material ({missingMatCount})</span>
              </button>

              {(quickFilters.onlyUrgent ||
                quickFilters.onlyPendingPayment ||
                quickFilters.onlyMissingMaterial ||
                quickFilters.searchQuery) && (
                <button
                  type="button"
                  onClick={() =>
                    setQuickFilters({
                      searchQuery: '',
                      onlyUrgent: false,
                      onlyPendingPayment: false,
                      onlyMissingMaterial: false,
                    })
                  }
                  className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Animated View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* =====================================================================
          ALWAYS-VISIBLE SPRING SPEED-DIAL FAB (+)
      ===================================================================== */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed right-4 bottom-24 lg:right-8 lg:bottom-8 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="flex flex-col items-end gap-2 mb-1"
            >
              {[
                {
                  id: 'project' as const,
                  label: 'Nuevo Proyecto',
                  icon: Film,
                  color: 'bg-lime-accent text-obsidian-950',
                },
                {
                  id: 'quote' as const,
                  label: 'Armar Cotización',
                  icon: FileText,
                  color: 'bg-violet-accent text-obsidian-950',
                },
                {
                  id: 'client' as const,
                  label: 'Registrar Cliente',
                  icon: Users,
                  color: 'bg-sky-400 text-obsidian-950',
                },
                {
                  id: 'block_date' as const,
                  label: 'Bloquear Fechas',
                  icon: CalendarOff,
                  color: 'bg-tangerine-accent text-white',
                },
              ].map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <motion.button
                    key={act.id}
                    type="button"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => {
                      setFabOpen(false);
                      setQuickCreateModal(act.id);
                    }}
                    className="flex items-center gap-3 rounded-full bg-obsidian-900 text-white border border-white/15 pl-4 pr-3 py-2.5 shadow-xl hover:border-lime-accent transition-colors"
                  >
                    <span className="text-sm font-bold">{act.label}</span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${act.color}`}
                    >
                      <ActIcon className="h-4 w-4" />
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setFabOpen((prev) => !prev)}
          aria-label="Acción rápida"
          className="motion-shimmer flex h-14 w-14 items-center justify-center rounded-full bg-lime-accent text-obsidian-950 shadow-glow-lime"
        >
          <motion.div
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
          >
            <Plus className="h-7 w-7 stroke-[2.8]" />
          </motion.div>
        </motion.button>
      </div>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION BAR WITH SPRING INDICATOR
      ===================================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-obsidian-900/95 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-safe select-none">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center py-1.5 gap-1 focus:outline-none"
              >
                <div className="relative flex h-9 w-12 items-center justify-center rounded-2xl">
                  {active && (
                    <motion.div
                      layoutId="mobileActiveNavPill"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute inset-0 rounded-2xl bg-lime-accent shadow-glow-lime"
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-5 w-5 ${
                      active
                        ? 'text-obsidian-950 stroke-[2.5]'
                        : 'text-slate-400 stroke-[1.9]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? 'text-lime-accent' : 'text-slate-400'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* =====================================================================
          ANIMATED TOAST NOTIFICATIONS
      ===================================================================== */}
      <div className="fixed top-4 right-4 z-[95] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl border backdrop-blur-xl ${
                t.type === 'error'
                  ? 'bg-red-950/90 border-red-500/40 text-red-200'
                  : t.type === 'info'
                  ? 'bg-obsidian-900/95 border-white/15 text-white'
                  : 'bg-obsidian-900/95 border-lime-accent/50 text-lime-accent'
              }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
