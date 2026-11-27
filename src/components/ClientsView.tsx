import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  FolderOpen,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { Client, KANBAN_COLUMNS } from '../types/studio';

const AVATAR_COLORS = ['#D9F950', '#B278FF', '#EE7D26', '#38BDF8', '#34D399', '#F472B6'];

export const ClientModal: React.FC<{
  existing?: Client | null;
  onClose: () => void;
}> = ({ existing, onClose }) => {
  const { upsertClient, showToast } = useStudio();

  const [name, setName] = useState(existing?.name || '');
  const [company, setCompany] = useState(existing?.company || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [brandFolderUrl, setBrandFolderUrl] = useState(
    existing?.brandFolderUrl || ''
  );
  const [preferencesNotes, setPreferencesNotes] = useState(
    existing?.preferencesNotes || ''
  );
  const [avatarColor, setAvatarColor] = useState(
    existing?.avatarColor || AVATAR_COLORS[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const clientObj: Client = {
      id: existing?.id || `cli-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      brandFolderUrl: brandFolderUrl.trim(),
      preferencesNotes: preferencesNotes.trim(),
      avatarColor,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await upsertClient(clientObj);
    showToast(
      existing ? 'Ficha de cliente actualizada' : 'Cliente registrado en CRM',
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-accent text-obsidian-950">
              <UserPlus className="h-5 w-5" />
            </span>
            <h3 className="font-display text-xl font-bold">
              {existing ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
            </h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Valeria Méndez"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Marca / Agencia / Canal
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Flix Media"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                WhatsApp (con código de país)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@marca.com"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Enlace fijo a Carpeta de Identidad / Logos (Drive, Dropbox...)
            </label>
            <input
              type="url"
              value={brandFolderUrl}
              onChange={(e) => setBrandFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-lime-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Notas de preferencias de edición
            </label>
            <textarea
              rows={3}
              value={preferencesNotes}
              onChange={(e) => setPreferencesNotes(e.target.value)}
              placeholder='Ej. "Le gustan los subtítulos dinámicos amarillos, música enérgica, cortes rápidos sin silencios..."'
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-lime-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
              Color distintivo
            </label>
            <div className="flex items-center gap-2.5">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAvatarColor(col)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    avatarColor === col ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
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
              className="rounded-2xl bg-lime-accent px-6 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ClientsView: React.FC = () => {
  const {
    clients,
    projects,
    settings,
    quickFilters,
    deleteClient,
    setSelectedProjectId,
  } = useStudio();

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(
    clients[0]?.id || null
  );

  const filteredClients = useMemo(() => {
    const q = quickFilters.searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.preferencesNotes.toLowerCase().includes(q)
    );
  }, [clients, quickFilters.searchQuery]);

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/[^\d]/g, '');
    const msg = encodeURIComponent(`Hola ${name} 👋 `);
    window.open(
      clean ? `https://wa.me/${clean}?text=${msg}` : `https://wa.me/?text=${msg}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <Users className="h-6 w-6 text-lime-accent" />
            Directorio de Clientes (CRM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            WhatsApp en 1 clic, carpeta de logos fija, preferencias de estilo e historial automático de pagos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreatingClient(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-2xl bg-lime-accent px-4 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover"
        >
          <Plus className="h-4 w-4 stroke-[2.6]" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-10 text-center">
          <p className="text-slate-400 text-sm">
            No se encontraron clientes. Agrega tu primer cliente con el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id);
            const totalBilled = clientProjects
              .filter((p) => p.status !== 'por_cotizar')
              .reduce((s, p) => s + p.price, 0);
            const totalPaid = clientProjects.reduce((s, p) => s + p.amountPaid, 0);
            const pendingBalance = Math.max(0, totalBilled - totalPaid);
            const isExpanded = expandedClientId === client.id;

            return (
              <div
                key={client.id}
                className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between gap-4 shadow-xs"
              >
                {/* Top Identity + Quick Buttons */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-obsidian-950"
                        style={{ backgroundColor: client.avatarColor }}
                      >
                        {client.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold truncate">
                          {client.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {client.company || 'Cliente independiente'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        className="rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-lime-accent"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteClient(client.id)}
                        title="Eliminar cliente"
                        className="rounded-xl bg-slate-100 dark:bg-obsidian-800 p-1.5 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Direct Action Pills: WhatsApp + Brand Folder + Email */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openWhatsApp(client.phone, client.name)}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3.5 py-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Abrir WhatsApp</span>
                    </button>

                    {client.brandFolderUrl && (
                      <a
                        href={
                          client.brandFolderUrl.startsWith('http')
                            ? client.brandFolderUrl
                            : `https://${client.brandFolderUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-lime-accent/15 hover:bg-lime-accent/25 border border-lime-accent/30 px-3.5 py-2 text-xs font-extrabold text-emerald-800 dark:text-lime-accent transition-colors"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>Carpeta Logos / Marca</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {client.phone && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 px-2">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}

                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2"
                      >
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </a>
                    )}
                  </div>

                  {/* Editing Style Preferences Box */}
                  <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-white/5 p-3.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-violet-500 dark:text-violet-300 mb-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Preferencias de edición
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {client.preferencesNotes ||
                        'Sin notas aún. Haz clic en Editar para guardar cómo le gustan los subtítulos, música o ritmo.'}
                    </p>
                  </div>
                </div>

                {/* Automatic Financial & Project History */}
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 dark:bg-obsidian-800/60 p-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Proyectos
                      </span>
                      <span className="font-display text-base font-extrabold">
                        {clientProjects.length}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-obsidian-800/60 p-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Pagado
                      </span>
                      <span className="font-display text-base font-extrabold text-emerald-500">
                        {settings.currency}
                        {totalPaid}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-obsidian-800/60 p-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Por cobrar
                      </span>
                      <span className="font-display text-base font-extrabold text-tangerine-accent">
                        {settings.currency}
                        {pendingBalance}
                      </span>
                    </div>
                  </div>

                  {clientProjects.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedClientId(isExpanded ? null : client.id)
                        }
                        className="w-full text-left text-xs font-bold text-slate-500 dark:text-lime-accent hover:underline"
                      >
                        {isExpanded
                          ? 'Ocultar historial de proyectos ▲'
                          : `Ver historial automático (${clientProjects.length} proyectos) ▼`}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {clientProjects.map((proj) => {
                            const col = KANBAN_COLUMNS.find(
                              (c) => c.id === proj.status
                            );
                            return (
                              <button
                                key={proj.id}
                                type="button"
                                onClick={() => setSelectedProjectId(proj.id)}
                                className="w-full flex items-center justify-between rounded-xl bg-slate-50 dark:bg-obsidian-800 px-3 py-2 text-left text-xs hover:border-lime-accent border border-transparent transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold truncate">{proj.title}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {col?.shortTitle} • Entrega {proj.dueDate}
                                  </p>
                                </div>
                                <span
                                  className={`ml-2 shrink-0 font-extrabold ${
                                    proj.paymentStatus === 'pagado'
                                      ? 'text-emerald-400'
                                      : 'text-tangerine-accent'
                                  }`}
                                >
                                  {settings.currency}
                                  {proj.amountPaid}/{settings.currency}
                                  {proj.price}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creatingClient || editingClient) && (
        <ClientModal
          existing={editingClient}
          onClose={() => {
            setCreatingClient(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
};
