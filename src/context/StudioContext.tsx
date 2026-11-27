import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { addDays, format } from 'date-fns';
import {
  ActiveTab,
  BlockedDate,
  Client,
  DEFAULT_CLIENT_CHECKLIST,
  DEFAULT_EDITOR_CHECKLIST,
  Project,
  ProjectStatus,
  QuickFilterState,
  Quote,
  StudioSettings,
} from '../types/studio';
import {
  INITIAL_BLOCKED_DATES,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_QUOTES,
  INITIAL_SETTINGS,
} from '../data/seedData';
import {
  clearCloudCredentials,
  CloudCredentials,
  fromDbBlockedDate,
  fromDbClient,
  fromDbProject,
  fromDbQuote,
  fromDbSettings,
  getStoredCloudCredentials,
  getSupabaseClient,
  saveCloudCredentials,
  toDbBlockedDate,
  toDbClient,
  toDbProject,
  toDbQuote,
  toDbSettings,
} from '../lib/supabase';

export type CloudSyncStatus = 'cloud_live' | 'connecting' | 'unconfigured' | 'error';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

const SAMPLE_PROJECT_IDS = ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6'];
const SAMPLE_CLIENT_IDS = ['cli-flix', 'cli-lemark', 'cli-nova'];
const SAMPLE_QUOTE_IDS = ['quo-1', 'quo-2'];
const SAMPLE_BLOCK_IDS = ['blk-1'];

const DEMO_CLEARED_KEY = 'cutflow_demo_cleared_v1';
const OFFLINE_CACHE_KEY = 'cutflow_offline_cache_v1';

interface StudioContextValue {
  settings: StudioSettings;
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  blockedDates: BlockedDate[];
  isLocked: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  previewPortalProjectId: string | null;
  setPreviewPortalProjectId: (id: string | null) => void;
  quickCreateModal: null | 'project' | 'client' | 'quote' | 'block_date';
  setQuickCreateModal: (m: null | 'project' | 'client' | 'quote' | 'block_date') => void;
  quickFilters: QuickFilterState;
  setQuickFilters: React.Dispatch<React.SetStateAction<QuickFilterState>>;
  syncStatus: CloudSyncStatus;
  syncError: string | null;
  cloudCredentials: CloudCredentials;
  connectSupabase: (creds: CloudCredentials) => Promise<boolean>;
  disconnectSupabase: () => void;
  pushAllToCloud: () => Promise<void>;
  hasSampleData: boolean;
  clearSampleData: () => Promise<void>;
  resetAllWorkspaceData: () => Promise<void>;
  unlockWithPin: (pin: string) => boolean;
  lockNow: () => void;
  updateSettings: (patch: Partial<StudioSettings>) => Promise<void>;
  upsertProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  moveProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  upsertClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  upsertQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  convertQuoteToProject: (quoteId: string, withDepositReceived?: boolean) => Promise<Project | null>;
  upsertBlockedDate: (b: BlockedDate) => Promise<void>;
  deleteBlockedDate: (id: string) => Promise<void>;
  exportBackupJson: () => void;
  exportBackupCsv: () => void;
  importBackupJson: (rawJson: string) => Promise<boolean>;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  hasMissingClientMaterial: (project: Project) => boolean;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const demoWasCleared = useMemo(() => {
    try {
      return localStorage.getItem(DEMO_CLEARED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  const cachedBundle = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(OFFLINE_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const [settings, setSettings] = useState<StudioSettings>(
    cachedBundle?.settings || INITIAL_SETTINGS
  );
  const [clients, setClients] = useState<Client[]>(
    cachedBundle?.clients ?? (demoWasCleared ? [] : INITIAL_CLIENTS)
  );
  const [projects, setProjects] = useState<Project[]>(
    cachedBundle?.projects ?? (demoWasCleared ? [] : INITIAL_PROJECTS)
  );
  const [quotes, setQuotes] = useState<Quote[]>(
    cachedBundle?.quotes ?? (demoWasCleared ? [] : INITIAL_QUOTES)
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(
    cachedBundle?.blockedDates ?? (demoWasCleared ? [] : INITIAL_BLOCKED_DATES)
  );

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const unlockedSession = sessionStorage.getItem('cutflow_unlocked') === 'true';
    return (cachedBundle?.settings?.pinEnabled ?? INITIAL_SETTINGS.pinEnabled) && !unlockedSession;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [previewPortalProjectId, setPreviewPortalProjectId] = useState<string | null>(null);
  const [quickCreateModal, setQuickCreateModal] = useState<
    null | 'project' | 'client' | 'quote' | 'block_date'
  >(null);

  const [quickFilters, setQuickFilters] = useState<QuickFilterState>({
    searchQuery: '',
    onlyUrgent: false,
    onlyPendingPayment: false,
    onlyMissingMaterial: false,
  });

  const [cloudCredentials, setCloudCredentials] = useState<CloudCredentials>(() =>
    getStoredCloudCredentials()
  );
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(() => {
    const creds = getStoredCloudCredentials();
    return creds.url && creds.anonKey ? 'connecting' : 'unconfigured';
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        OFFLINE_CACHE_KEY,
        JSON.stringify({ settings, clients, projects, quotes, blockedDates })
      );
    } catch {
      // ignore quota errors
    }
  }, [settings, clients, projects, quotes, blockedDates]);

  const hasMissingClientMaterial = useCallback((project: Project): boolean => {
    if (project.status === 'entregado') return false;
    if (project.status === 'esperando_material') return true;
    return project.clientChecklist.some((item) => !item.completed);
  }, []);

  const hasSampleData = useMemo(() => {
    return (
      projects.some((p) => SAMPLE_PROJECT_IDS.includes(p.id)) ||
      clients.some((c) => SAMPLE_CLIENT_IDS.includes(c.id)) ||
      quotes.some((q) => SAMPLE_QUOTE_IDS.includes(q.id)) ||
      blockedDates.some((b) => SAMPLE_BLOCK_IDS.includes(b.id))
    );
  }, [projects, clients, quotes, blockedDates]);

  const pushAllToCloud = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const results = await Promise.all([
      supabase.from('studio_settings').upsert(toDbSettings(settings)),
      clients.length > 0
        ? supabase.from('clients').upsert(clients.map(toDbClient))
        : Promise.resolve({ error: null }),
      projects.length > 0
        ? supabase.from('projects').upsert(projects.map(toDbProject))
        : Promise.resolve({ error: null }),
      quotes.length > 0
        ? supabase.from('quotes').upsert(quotes.map(toDbQuote))
        : Promise.resolve({ error: null }),
      blockedDates.length > 0
        ? supabase.from('blocked_dates').upsert(blockedDates.map(toDbBlockedDate))
        : Promise.resolve({ error: null }),
    ]);

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) {
      throw new Error(firstError.message);
    }
  }, [settings, clients, projects, quotes, blockedDates]);

  // Clear ONLY Demo/Sample Data (keeps user's real items intact!)
  const clearSampleData = useCallback(async () => {
    localStorage.setItem(DEMO_CLEARED_KEY, 'true');
    setProjects((prev) => prev.filter((p) => !SAMPLE_PROJECT_IDS.includes(p.id)));
    setClients((prev) => prev.filter((c) => !SAMPLE_CLIENT_IDS.includes(c.id)));
    setQuotes((prev) => prev.filter((q) => !SAMPLE_QUOTE_IDS.includes(q.id)));
    setBlockedDates((prev) => prev.filter((b) => !SAMPLE_BLOCK_IDS.includes(b.id)));
    if (selectedProjectId && SAMPLE_PROJECT_IDS.includes(selectedProjectId)) {
      setSelectedProjectId(null);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await Promise.all([
        supabase.from('projects').delete().in('id', SAMPLE_PROJECT_IDS),
        supabase.from('clients').delete().in('id', SAMPLE_CLIENT_IDS),
        supabase.from('quotes').delete().in('id', SAMPLE_QUOTE_IDS),
        supabase.from('blocked_dates').delete().in('id', SAMPLE_BLOCK_IDS),
      ]);
    }
    showToast('¡Datos de ejemplo eliminados! Tu estudio está limpio.', 'success');
  }, [selectedProjectId, showToast]);

  // Wipe ALL workspace items (clean slate)
  const resetAllWorkspaceData = useCallback(async () => {
    localStorage.setItem(DEMO_CLEARED_KEY, 'true');
    const allProjIds = projects.map((p) => p.id);
    const allCliIds = clients.map((c) => c.id);
    const allQuoIds = quotes.map((q) => q.id);
    const allBlkIds = blockedDates.map((b) => b.id);

    setProjects([]);
    setClients([]);
    setQuotes([]);
    setBlockedDates([]);
    setSelectedProjectId(null);

    const supabase = getSupabaseClient();
    if (supabase) {
      await Promise.all([
        allProjIds.length
          ? supabase.from('projects').delete().in('id', allProjIds)
          : Promise.resolve(),
        allCliIds.length
          ? supabase.from('clients').delete().in('id', allCliIds)
          : Promise.resolve(),
        allQuoIds.length
          ? supabase.from('quotes').delete().in('id', allQuoIds)
          : Promise.resolve(),
        allBlkIds.length
          ? supabase.from('blocked_dates').delete().in('id', allBlkIds)
          : Promise.resolve(),
      ]);
    }
    showToast('Estudio reiniciado completamente en blanco', 'info');
  }, [projects, clients, quotes, blockedDates, showToast]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSyncStatus('unconfigured');
      setSyncError(null);
      return;
    }

    let cancelled = false;
    setSyncStatus('connecting');
    setSyncError(null);

    async function loadInitialFromCloud() {
      if (!supabase) return;
      try {
        const [settingsRes, clientsRes, projectsRes, quotesRes, blockedRes] =
          await Promise.all([
            supabase.from('studio_settings').select('*').eq('id', 'main').maybeSingle(),
            supabase.from('clients').select('*').order('created_at', { ascending: true }),
            supabase.from('projects').select('*').order('created_at', { ascending: false }),
            supabase.from('quotes').select('*').order('created_at', { ascending: false }),
            supabase.from('blocked_dates').select('*').order('start_date', { ascending: true }),
          ]);

        const anyError =
          settingsRes.error ||
          clientsRes.error ||
          projectsRes.error ||
          quotesRes.error ||
          blockedRes.error;

        if (anyError) {
          if (!cancelled) {
            setSyncStatus('error');
            setSyncError(
              anyError.message.includes('relation')
                ? 'Falta crear las tablas en Supabase. Ve a Ajustes -> Base de Datos en la Nube y ejecuta el script SQL.'
                : anyError.message
            );
          }
          return;
        }

        if (cancelled) return;

        const cloudIsEmpty =
          !settingsRes.data &&
          (clientsRes.data?.length ?? 0) === 0 &&
          (projectsRes.data?.length ?? 0) === 0 &&
          (quotesRes.data?.length ?? 0) === 0;

        const clearedDemoFlag = localStorage.getItem(DEMO_CLEARED_KEY) === 'true';

        if (cloudIsEmpty && !clearedDemoFlag) {
          await Promise.all([
            supabase.from('studio_settings').upsert(toDbSettings(settings)),
            clients.length
              ? supabase.from('clients').upsert(clients.map(toDbClient))
              : Promise.resolve(),
            projects.length
              ? supabase.from('projects').upsert(projects.map(toDbProject))
              : Promise.resolve(),
            quotes.length
              ? supabase.from('quotes').upsert(quotes.map(toDbQuote))
              : Promise.resolve(),
            blockedDates.length
              ? supabase.from('blocked_dates').upsert(blockedDates.map(toDbBlockedDate))
              : Promise.resolve(),
          ]);
        } else {
          if (settingsRes.data) setSettings(fromDbSettings(settingsRes.data));
          if (clientsRes.data) setClients(clientsRes.data.map(fromDbClient));
          if (projectsRes.data) setProjects(projectsRes.data.map(fromDbProject));
          if (quotesRes.data) setQuotes(quotesRes.data.map(fromDbQuote));
          if (blockedRes.data) setBlockedDates(blockedRes.data.map(fromDbBlockedDate));
        }

        setSyncStatus('cloud_live');
        setSyncError(null);
      } catch (err: any) {
        if (!cancelled) {
          setSyncStatus('error');
          setSyncError(err?.message || 'Error al conectar con Supabase');
        }
      }
    }

    loadInitialFromCloud();

    const channel = supabase
      .channel('cutflow-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setProjects((prev) => prev.filter((p) => p.id !== deletedId));
            }
          } else if (payload.new) {
            const incoming = fromDbProject(payload.new as any);
            setProjects((prev) => {
              const exists = prev.some((p) => p.id === incoming.id);
              return exists
                ? prev.map((p) => (p.id === incoming.id ? incoming : p))
                : [incoming, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setClients((prev) => prev.filter((c) => c.id !== deletedId));
            }
          } else if (payload.new) {
            const incoming = fromDbClient(payload.new as any);
            setClients((prev) => {
              const exists = prev.some((c) => c.id === incoming.id);
              return exists
                ? prev.map((c) => (c.id === incoming.id ? incoming : c))
                : [...prev, incoming];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setQuotes((prev) => prev.filter((q) => q.id !== deletedId));
            }
          } else if (payload.new) {
            const incoming = fromDbQuote(payload.new as any);
            setQuotes((prev) => {
              const exists = prev.some((q) => q.id === incoming.id);
              return exists
                ? prev.map((q) => (q.id === incoming.id ? incoming : q))
                : [incoming, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_dates' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setBlockedDates((prev) => prev.filter((b) => b.id !== deletedId));
            }
          } else if (payload.new) {
            const incoming = fromDbBlockedDate(payload.new as any);
            setBlockedDates((prev) => {
              const exists = prev.some((b) => b.id === incoming.id);
              return exists
                ? prev.map((b) => (b.id === incoming.id ? incoming : b))
                : [...prev, incoming];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'studio_settings' },
        (payload) => {
          if (payload.new) {
            setSettings(fromDbSettings(payload.new as any));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [cloudCredentials.url, cloudCredentials.anonKey]);

  const connectSupabase = useCallback(
    async (creds: CloudCredentials): Promise<boolean> => {
      saveCloudCredentials(creds);
      setCloudCredentials({
        url: creds.url.trim().replace(/\/+$/, ''),
        anonKey: creds.anonKey.trim(),
      });
      showToast('Credenciales guardadas. Sincronizando con Supabase...', 'info');
      return true;
    },
    [showToast]
  );

  const disconnectSupabase = useCallback(() => {
    clearCloudCredentials();
    setCloudCredentials({ url: '', anonKey: '' });
    setSyncStatus('unconfigured');
    setSyncError(null);
    showToast('Desconectado de Supabase Cloud', 'info');
  }, [showToast]);

  const unlockWithPin = useCallback(
    (pin: string): boolean => {
      if (pin === settings.pinCode) {
        setIsLocked(false);
        sessionStorage.setItem('cutflow_unlocked', 'true');
        return true;
      }
      return false;
    },
    [settings.pinCode]
  );

  const lockNow = useCallback(() => {
    sessionStorage.removeItem('cutflow_unlocked');
    setIsLocked(true);
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<StudioSettings>) => {
      const next: StudioSettings = {
        ...settings,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setSettings(next);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('studio_settings').upsert(toDbSettings(next));
        if (error) {
          showToast(`Error sincronizando ajustes: ${error.message}`, 'error');
        }
      }
    },
    [settings, showToast]
  );

  const upsertProject = useCallback(
    async (project: Project) => {
      const updated = { ...project, updatedAt: new Date().toISOString() };
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === updated.id);
        return exists
          ? prev.map((p) => (p.id === updated.id ? updated : p))
          : [updated, ...prev];
      });
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').upsert(toDbProject(updated));
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
    },
    [showToast]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) setSelectedProjectId(null);
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
      showToast('Proyecto eliminado', 'info');
    },
    [selectedProjectId, showToast]
  );

  const moveProjectStatus = useCallback(
    async (id: string, status: ProjectStatus) => {
      const target = projects.find((p) => p.id === id);
      if (!target || target.status === status) return;
      const updated: Project = {
        ...target,
        status,
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').upsert(toDbProject(updated));
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
    },
    [projects, showToast]
  );

  const upsertClient = useCallback(
    async (client: Client) => {
      setClients((prev) => {
        const exists = prev.some((c) => c.id === client.id);
        return exists
          ? prev.map((c) => (c.id === client.id ? client : c))
          : [...prev, client];
      });
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('clients').upsert(toDbClient(client));
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
    },
    [showToast]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      setClients((prev) => prev.filter((c) => c.id !== id));
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
      showToast('Cliente eliminado', 'info');
    },
    [showToast]
  );

  const upsertQuote = useCallback(
    async (quote: Quote) => {
      setQuotes((prev) => {
        const exists = prev.some((q) => q.id === quote.id);
        return exists
          ? prev.map((q) => (q.id === quote.id ? quote : q))
          : [quote, ...prev];
      });
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('quotes').upsert(toDbQuote(quote));
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
    },
    [showToast]
  );

  const deleteQuote = useCallback(
    async (id: string) => {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
      showToast('Cotización eliminada', 'info');
    },
    [showToast]
  );

  const convertQuoteToProject = useCallback(
    async (quoteId: string, withDepositReceived = true): Promise<Project | null> => {
      const quote = quotes.find((q) => q.id === quoteId);
      if (!quote) return null;

      const total = quote.items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
      );
      const depositAmount = Math.round((total * quote.depositPercent) / 100);
      const paid = withDepositReceived ? depositAmount : 0;

      const newProject: Project = {
        id: `proj-${crypto.randomUUID().slice(0, 8)}`,
        title: quote.title,
        description:
          quote.items
            .map((i) => `• ${i.quantity}x ${i.description}`)
            .join('\n') + (quote.notes ? `\n\nNotas: ${quote.notes}` : ''),
        clientId: quote.clientId,
        status: 'esperando_material',
        priority: 'normal',
        format: quote.format,
        dueDate: format(addDays(new Date(), quote.deliveryDays || 4), 'yyyy-MM-dd'),
        price: total,
        amountPaid: paid,
        paymentStatus:
          paid >= total && total > 0
            ? 'pagado'
            : paid > 0
            ? 'anticipo'
            : 'sin_pagar',
        revisionsUsed: 0,
        revisionsIncluded: quote.revisionsIncluded || 2,
        clientChecklist: DEFAULT_CLIENT_CHECKLIST(),
        editorChecklist: DEFAULT_EDITOR_CHECKLIST(quote.format),
        links: { drive: '', wetransfer: '', frameio: '', references: '' },
        quoteId: quote.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedQuote: Quote = {
        ...quote,
        status: 'aprobada',
        convertedProjectId: newProject.id,
      };

      await Promise.all([upsertProject(newProject), upsertQuote(updatedQuote)]);
      showToast('¡Cotización convertida en tarjeta del Kanban!', 'success');
      return newProject;
    },
    [quotes, upsertProject, upsertQuote, showToast]
  );

  const upsertBlockedDate = useCallback(
    async (b: BlockedDate) => {
      setBlockedDates((prev) => {
        const exists = prev.some((item) => item.id === b.id);
        return exists
          ? prev.map((item) => (item.id === b.id ? b : item))
          : [...prev, b];
      });
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('blocked_dates')
          .upsert(toDbBlockedDate(b));
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
    },
    [showToast]
  );

  const deleteBlockedDate = useCallback(
    async (id: string) => {
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
        if (error) showToast(`Error nube: ${error.message}`, 'error');
      }
      showToast('Bloqueo de fecha eliminado', 'info');
    },
    [showToast]
  );

  const exportBackupJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'CutFlow Studio',
      version: '1.1.0',
      settings,
      clients,
      projects,
      quotes,
      blockedDates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON descargado correctamente', 'success');
  }, [settings, clients, projects, quotes, blockedDates, showToast]);

  const exportBackupCsv = useCallback(() => {
    const esc = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const clientMap = new Map(clients.map((c) => [c.id, `${c.name} (${c.company})`]));

    const projHeaders = [
      'Tipo',
      'ID',
      'Título / Nombre',
      'Cliente / Empresa',
      'Estado',
      'Formato',
      'Prioridad',
      'Fecha Entrega',
      'Precio Total',
      'Monto Cobrado',
      'Pendiente',
      'Estado Pago',
      'Revisiones',
    ];

    const projRows = projects.map((p) => [
      esc('Proyecto'),
      esc(p.id),
      esc(p.title),
      esc(clientMap.get(p.clientId) || 'Sin cliente'),
      esc(p.status),
      esc(p.format),
      esc(p.priority),
      esc(p.dueDate),
      esc(p.price),
      esc(p.amountPaid),
      esc(Math.max(0, p.price - p.amountPaid)),
      esc(p.paymentStatus),
      esc(`${p.revisionsUsed}/${p.revisionsIncluded}`),
    ]);

    const clientRows = clients.map((c) => [
      esc('Cliente'),
      esc(c.id),
      esc(c.name),
      esc(c.company),
      esc(c.phone),
      esc(c.email),
      esc(c.brandFolderUrl),
      esc(c.preferencesNotes),
      esc(''),
      esc(''),
      esc(''),
      esc(''),
      esc(''),
    ]);

    const csvContent =
      '\uFEFF' +
      [
        projHeaders.map(esc).join(','),
        ...projRows.map((r) => r.join(',')),
        ...clientRows.map((r) => r.join(',')),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cutflow-clientes-proyectos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo CSV exportado correctamente', 'success');
  }, [clients, projects, showToast]);

  const importBackupJson = useCallback(
    async (rawJson: string): Promise<boolean> => {
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed.settings) setSettings(parsed.settings);
        if (Array.isArray(parsed.clients)) setClients(parsed.clients);
        if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
        if (Array.isArray(parsed.quotes)) setQuotes(parsed.quotes);
        if (Array.isArray(parsed.blockedDates)) setBlockedDates(parsed.blockedDates);

        const supabase = getSupabaseClient();
        if (supabase) {
          await Promise.all([
            parsed.settings
              ? supabase.from('studio_settings').upsert(toDbSettings(parsed.settings))
              : Promise.resolve(),
            Array.isArray(parsed.clients) && parsed.clients.length
              ? supabase.from('clients').upsert(parsed.clients.map(toDbClient))
              : Promise.resolve(),
            Array.isArray(parsed.projects) && parsed.projects.length
              ? supabase.from('projects').upsert(parsed.projects.map(toDbProject))
              : Promise.resolve(),
            Array.isArray(parsed.quotes) && parsed.quotes.length
              ? supabase.from('quotes').upsert(parsed.quotes.map(toDbQuote))
              : Promise.resolve(),
            Array.isArray(parsed.blockedDates) && parsed.blockedDates.length
              ? supabase.from('blocked_dates').upsert(parsed.blockedDates.map(toDbBlockedDate))
              : Promise.resolve(),
          ]);
        }
        showToast('Respaldo restaurado con éxito', 'success');
        return true;
      } catch {
        showToast('Archivo JSON inválido', 'error');
        return false;
      }
    },
    [showToast]
  );

  const value: StudioContextValue = {
    settings,
    clients,
    projects,
    quotes,
    blockedDates,
    isLocked,
    activeTab,
    setActiveTab,
    selectedProjectId,
    setSelectedProjectId,
    previewPortalProjectId,
    setPreviewPortalProjectId,
    quickCreateModal,
    setQuickCreateModal,
    quickFilters,
    setQuickFilters,
    syncStatus,
    syncError,
    cloudCredentials,
    connectSupabase,
    disconnectSupabase,
    pushAllToCloud,
    hasSampleData,
    clearSampleData,
    resetAllWorkspaceData,
    unlockWithPin,
    lockNow,
    updateSettings,
    upsertProject,
    deleteProject,
    moveProjectStatus,
    upsertClient,
    deleteClient,
    upsertQuote,
    deleteQuote,
    convertQuoteToProject,
    upsertBlockedDate,
    deleteBlockedDate,
    exportBackupJson,
    exportBackupCsv,
    importBackupJson,
    toasts,
    showToast,
    hasMissingClientMaterial,
  };

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
};

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider');
  return ctx;
}
