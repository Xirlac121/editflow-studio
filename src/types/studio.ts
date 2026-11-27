export type ProjectStatus =
  | 'por_cotizar'
  | 'esperando_material'
  | 'en_edicion'
  | 'en_revision'
  | 'ajustes'
  | 'entregado';

export type ProjectPriority = 'urgente' | 'normal';

export type ProjectFormat = 'Reel/TikTok' | 'YouTube' | 'Foto' | 'Diseño';

export type PaymentStatus = 'sin_pagar' | 'anticipo' | 'pagado';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ProjectLinks {
  drive: string;
  wetransfer: string;
  frameio: string;
  references: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  format: ProjectFormat;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  price: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  revisionsUsed: number;
  revisionsIncluded: number;
  clientChecklist: ChecklistItem[];
  editorChecklist: ChecklistItem[];
  links: ProjectLinks;
  quoteId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  brandFolderUrl: string;
  preferencesNotes: string;
  avatarColor: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type QuoteStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada';

export interface Quote {
  id: string;
  number: string;
  title: string;
  clientId: string;
  clientNameSnapshot: string;
  format: ProjectFormat;
  items: QuoteItem[];
  depositPercent: number;
  revisionsIncluded: number;
  deliveryDays: number;
  validUntil: string;
  notes: string;
  status: QuoteStatus;
  convertedProjectId?: string;
  createdAt: string;
}

export interface BlockedDate {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'tentativo' | 'no_disponible';
  notes: string;
}

export interface StudioSettings {
  id: string;
  editorName: string;
  studioName: string;
  pinCode: string; // 4-6 digits
  pinEnabled: boolean;
  currency: string;
  theme: 'dark' | 'light';
  updatedAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'kanban'
  | 'calendar'
  | 'clients'
  | 'quotes'
  | 'settings';

export interface QuickFilterState {
  searchQuery: string;
  onlyUrgent: boolean;
  onlyPendingPayment: boolean;
  onlyMissingMaterial: boolean;
}

export const KANBAN_COLUMNS: {
  id: ProjectStatus;
  title: string;
  shortTitle: string;
  subtitle: string;
  color: string;
  dotColor: string;
  badgeBg: string;
}[] = [
  {
    id: 'por_cotizar',
    title: 'Por cotizar / Futuros',
    shortTitle: 'Futuros',
    subtitle: 'Ideas o trabajos tentativos',
    color: '#94A3B8',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  {
    id: 'esperando_material',
    title: 'Esperando material',
    shortTitle: 'Falta material',
    subtitle: 'Aprobados sin archivos aún',
    color: '#EE7D26',
    dotColor: 'bg-tangerine-accent',
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  {
    id: 'en_edicion',
    title: 'En edición',
    shortTitle: 'En edición',
    subtitle: 'En timeline actualmente',
    color: '#D9F950',
    dotColor: 'bg-lime-accent',
    badgeBg: 'bg-lime-accent/15 text-lime-accent border-lime-accent/30',
  },
  {
    id: 'en_revision',
    title: 'En revisión',
    shortTitle: 'En revisión',
    subtitle: 'Esperando feedback del cliente',
    color: '#B278FF',
    dotColor: 'bg-violet-accent',
    badgeBg: 'bg-violet-accent/15 text-violet-300 border-violet-accent/30',
  },
  {
    id: 'ajustes',
    title: 'Ajustes / Cambios',
    shortTitle: 'Ajustes',
    subtitle: 'Aplicando correcciones',
    color: '#38BDF8',
    dotColor: 'bg-sky-400',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  {
    id: 'entregado',
    title: 'Entregado',
    shortTitle: 'Entregado',
    subtitle: 'Render final aprobado',
    color: '#34D399',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
];

export const DEFAULT_CLIENT_CHECKLIST = (): ChecklistItem[] => [
  { id: crypto.randomUUID(), label: 'Videos en bruto (RAW)', completed: false },
  { id: crypto.randomUUID(), label: 'Guion / Estructura', completed: false },
  { id: crypto.randomUUID(), label: 'Logos y manual de marca', completed: false },
  { id: crypto.randomUUID(), label: 'Música o referencias de audio', completed: false },
];

export const DEFAULT_EDITOR_CHECKLIST = (format: ProjectFormat = 'Reel/TikTok'): ChecklistItem[] => {
  if (format === 'Foto' || format === 'Diseño') {
    return [
      { id: crypto.randomUUID(), label: 'Selección y composición', completed: false },
      { id: crypto.randomUUID(), label: 'Retoque / Colorimetría', completed: false },
      { id: crypto.randomUUID(), label: 'Tipografía y gráficos', completed: false },
      { id: crypto.randomUUID(), label: 'Exportación final alta res', completed: false },
    ];
  }
  return [
    { id: crypto.randomUUID(), label: 'Corte y ritmo narrativo (Rough Cut)', completed: false },
    { id: crypto.randomUUID(), label: 'Corrección de color / LUTs', completed: false },
    { id: crypto.randomUUID(), label: 'Subtítulos dinámicos y B-Roll', completed: false },
    { id: crypto.randomUUID(), label: 'Diseño sonoro y mezcla de audio', completed: false },
    { id: crypto.randomUUID(), label: 'Render y revisión de calidad', completed: false },
  ];
};
