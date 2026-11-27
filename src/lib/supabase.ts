import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  BlockedDate,
  Client,
  Project,
  Quote,
  StudioSettings,
} from '../types/studio';

const CREDENTIALS_STORAGE_KEY = 'cutflow_supabase_credentials_v1';

export interface CloudCredentials {
  url: string;
  anonKey: string;
}

export function getStoredCloudCredentials(): CloudCredentials {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CloudCredentials;
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }

  return {
    url: envUrl?.trim() || '',
    anonKey: envKey?.trim() || '',
  };
}

export function saveCloudCredentials(creds: CloudCredentials) {
  localStorage.setItem(
    CREDENTIALS_STORAGE_KEY,
    JSON.stringify({
      url: creds.url.trim(),
      anonKey: creds.anonKey.trim(),
    })
  );
}

export function clearCloudCredentials() {
  localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
}

let cachedClient: SupabaseClient | null = null;
let cachedKeySignature = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredCloudCredentials();
  if (!url || !anonKey) {
    cachedClient = null;
    cachedKeySignature = '';
    return null;
  }

  const sig = `${url}::${anonKey}`;
  if (cachedClient && cachedKeySignature === sig) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    cachedKeySignature = sig;
    return cachedClient;
  } catch {
    return null;
  }
}

// ============================================================================
// Database Row Mappers (snake_case Postgres <-> camelCase TypeScript)
// ============================================================================

export function toDbProject(p: Project) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    client_id: p.clientId,
    status: p.status,
    priority: p.priority,
    format: p.format,
    due_date: p.dueDate,
    due_time: p.dueTime || '',
    price: p.price,
    amount_paid: p.amountPaid,
    payment_status: p.paymentStatus,
    revisions_used: p.revisionsUsed,
    revisions_included: p.revisionsIncluded,
    client_checklist: p.clientChecklist,
    editor_checklist: p.editorChecklist,
    links: p.links,
    quote_id: p.quoteId || null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function fromDbProject(row: Record<string, any>): Project {
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    clientId: row.client_id || '',
    status: row.status || 'por_cotizar',
    priority: row.priority || 'normal',
    format: row.format || 'Reel/TikTok',
    dueDate: row.due_date || new Date().toISOString().slice(0, 10),
    dueTime: row.due_time || '',
    price: Number(row.price ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    paymentStatus: row.payment_status || 'sin_pagar',
    revisionsUsed: Number(row.revisions_used ?? 0),
    revisionsIncluded: Number(row.revisions_included ?? 2),
    clientChecklist: Array.isArray(row.client_checklist) ? row.client_checklist : [],
    editorChecklist: Array.isArray(row.editor_checklist) ? row.editor_checklist : [],
    links: row.links || { drive: '', wetransfer: '', frameio: '', references: '' },
    quoteId: row.quote_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function toDbClient(c: Client) {
  return {
    id: c.id,
    name: c.name,
    company: c.company,
    phone: c.phone,
    email: c.email,
    brand_folder_url: c.brandFolderUrl,
    preferences_notes: c.preferencesNotes,
    avatar_color: c.avatarColor,
    created_at: c.createdAt,
  };
}

export function fromDbClient(row: Record<string, any>): Client {
  return {
    id: row.id,
    name: row.name || '',
    company: row.company || '',
    phone: row.phone || '',
    email: row.email || '',
    brandFolderUrl: row.brand_folder_url || '',
    preferencesNotes: row.preferences_notes || '',
    avatarColor: row.avatar_color || '#D9F950',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function toDbQuote(q: Quote) {
  return {
    id: q.id,
    number: q.number,
    title: q.title,
    client_id: q.clientId,
    client_name_snapshot: q.clientNameSnapshot,
    format: q.format,
    items: q.items,
    deposit_percent: q.depositPercent,
    revisions_included: q.revisionsIncluded,
    delivery_days: q.deliveryDays,
    valid_until: q.validUntil,
    notes: q.notes,
    status: q.status,
    converted_project_id: q.convertedProjectId || null,
    created_at: q.createdAt,
  };
}

export function fromDbQuote(row: Record<string, any>): Quote {
  return {
    id: row.id,
    number: row.number || 'COT-001',
    title: row.title || '',
    clientId: row.client_id || '',
    clientNameSnapshot: row.client_name_snapshot || '',
    format: row.format || 'Reel/TikTok',
    items: Array.isArray(row.items) ? row.items : [],
    depositPercent: Number(row.deposit_percent ?? 50),
    revisionsIncluded: Number(row.revisions_included ?? 2),
    deliveryDays: Number(row.delivery_days ?? 4),
    validUntil: row.valid_until || '',
    notes: row.notes || '',
    status: row.status || 'borrador',
    convertedProjectId: row.converted_project_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function toDbBlockedDate(b: BlockedDate) {
  return {
    id: b.id,
    title: b.title,
    start_date: b.startDate,
    end_date: b.endDate,
    type: b.type,
    notes: b.notes,
  };
}

export function fromDbBlockedDate(row: Record<string, any>): BlockedDate {
  return {
    id: row.id,
    title: row.title || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    type: row.type || 'tentativo',
    notes: row.notes || '',
  };
}

export function toDbSettings(s: StudioSettings) {
  return {
    id: 'main',
    editor_name: s.editorName,
    studio_name: s.studioName,
    pin_code: s.pinCode,
    pin_enabled: s.pinEnabled,
    currency: s.currency,
    theme: s.theme,
    updated_at: s.updatedAt,
  };
}

export function fromDbSettings(row: Record<string, any>): StudioSettings {
  return {
    id: row.id || 'main',
    editorName: row.editor_name || 'Editor',
    studioName: row.studio_name || 'CutFlow Studio',
    pinCode: row.pin_code || '1234',
    pinEnabled: row.pin_enabled ?? true,
    currency: row.currency || '$',
    theme: row.theme === 'light' ? 'light' : 'dark',
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const SUPABASE_SETUP_SQL = `-- Ejecuta este SQL en Supabase -> SQL Editor -> New Query
create table if not exists public.studio_settings (
  id text primary key default 'main',
  editor_name text not null default 'Editor',
  studio_name text not null default 'CutFlow Studio',
  pin_code text not null default '1234',
  pin_enabled boolean not null default true,
  currency text not null default '$',
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id text primary key,
  name text not null,
  company text not null default '',
  phone text not null default '',
  email text not null default '',
  brand_folder_url text not null default '',
  preferences_notes text not null default '',
  avatar_color text not null default '#D9F950',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  description text not null default '',
  client_id text not null default '',
  status text not null default 'por_cotizar',
  priority text not null default 'normal',
  format text not null default 'Reel/TikTok',
  due_date text not null,
  due_time text default '',
  price numeric not null default 0,
  amount_paid numeric not null default 0,
  payment_status text not null default 'sin_pagar',
  revisions_used integer not null default 0,
  revisions_included integer not null default 2,
  client_checklist jsonb not null default '[]'::jsonb,
  editor_checklist jsonb not null default '[]'::jsonb,
  links jsonb not null default '{"drive":"","wetransfer":"","frameio":"","references":""}'::jsonb,
  quote_id text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id text primary key,
  number text not null,
  title text not null,
  client_id text not null default '',
  client_name_snapshot text not null default '',
  format text not null default 'Reel/TikTok',
  items jsonb not null default '[]'::jsonb,
  deposit_percent numeric not null default 50,
  revisions_included integer not null default 2,
  delivery_days integer not null default 4,
  valid_until text not null default '',
  notes text not null default '',
  status text not null default 'borrador',
  converted_project_id text default null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_dates (
  id text primary key,
  title text not null,
  start_date text not null,
  end_date text not null,
  type text not null default 'tentativo',
  notes text not null default ''
);

alter table public.studio_settings enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.blocked_dates enable row level security;

drop policy if exists "Studio single user full access settings" on public.studio_settings;
create policy "Studio single user full access settings" on public.studio_settings for all using (true) with check (true);
drop policy if exists "Studio single user full access clients" on public.clients;
create policy "Studio single user full access clients" on public.clients for all using (true) with check (true);
drop policy if exists "Studio single user full access projects" on public.projects;
create policy "Studio single user full access projects" on public.projects for all using (true) with check (true);
drop policy if exists "Studio single user full access quotes" on public.quotes;
create policy "Studio single user full access quotes" on public.quotes for all using (true) with check (true);
drop policy if exists "Studio single user full access blocked_dates" on public.blocked_dates;
create policy "Studio single user full access blocked_dates" on public.blocked_dates for all using (true) with check (true);

alter publication supabase_realtime add table public.projects, public.clients, public.quotes, public.blocked_dates, public.studio_settings;`;
