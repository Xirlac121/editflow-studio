import React, { useMemo, useState } from 'react';
import { addDays, format, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  Copy,
  DollarSign,
  Download,
  FileText,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { ProjectFormat, Quote, QuoteItem } from '../types/studio';
import { generateQuotePdf } from '../lib/pdfGenerator';

const PRESET_SERVICES = [
  { label: '+ Pack 4 Reels', description: 'Edición dinámica de Pack 4 Reels (subtítulos, B-Roll y SFX)', qty: 1, price: 240 },
  { label: '+ Reel Individual', description: 'Edición de Reel / TikTok vertical hasta 60s', qty: 1, price: 65 },
  { label: '+ Video YouTube', description: 'Edición Video YouTube Long-form (8-12 min)', qty: 1, price: 190 },
  { label: '+ Entrega Express', description: 'Recargo por Entrega Express (24h)', qty: 1, price: 50 },
  { label: '+ Miniatura CTR', description: 'Diseño de Miniatura YouTube alto CTR', qty: 1, price: 35 },
];

export const QuoteBuilderModal: React.FC<{
  existing?: Quote | null;
  onClose: () => void;
}> = ({ existing, onClose }) => {
  const { clients, quotes, settings, upsertQuote, showToast } = useStudio();

  const nextQuoteNum = useMemo(() => {
    if (existing?.number) return existing.number;
    return `COT-${101 + quotes.length + 1}`;
  }, [existing, quotes.length]);

  const [title, setTitle] = useState(existing?.title || '');
  const [clientId, setClientId] = useState(existing?.clientId || clients[0]?.id || '');
  const [manualClientName, setManualClientName] = useState(
    existing?.clientNameSnapshot || ''
  );
  const [formatType, setFormatType] = useState<ProjectFormat>(
    existing?.format || 'Reel/TikTok'
  );
  const [depositPercent, setDepositPercent] = useState(existing?.depositPercent ?? 50);
  const [revisionsIncluded, setRevisionsIncluded] = useState(
    existing?.revisionsIncluded ?? 2
  );
  const [deliveryDays, setDeliveryDays] = useState(existing?.deliveryDays ?? 4);
  const [validUntil, setValidUntil] = useState(
    existing?.validUntil || format(addDays(new Date(), 10), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState(
    existing?.notes ||
      'Incluye corrección de color, mezcla de audio, subtítulos dinámicos y música libre de derechos.'
  );
  const [items, setItems] = useState<QuoteItem[]>(
    existing?.items?.length
      ? existing.items
      : [{ id: crypto.randomUUID(), description: 'Edición de 4 Reels dinámicos', quantity: 1, unitPrice: 240 }]
  );

  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const depositAmount = Math.round((total * depositPercent) / 100);

  const addItem = (desc = '', qty = 1, price = 80) => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: desc, quantity: qty, unitPrice: price },
    ]);
  };

  const updateItem = (id: string, patch: Partial<QuoteItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedClient = clients.find((c) => c.id === clientId);
    const snapshot = selectedClient
      ? `${selectedClient.name}${selectedClient.company ? ` — ${selectedClient.company}` : ''}`
      : manualClientName.trim() || 'Cliente';

    const quoteObj: Quote = {
      id: existing?.id || `quo-${crypto.randomUUID().slice(0, 8)}`,
      number: nextQuoteNum,
      title: title.trim(),
      clientId,
      clientNameSnapshot: snapshot,
      format: formatType,
      items,
      depositPercent,
      revisionsIncluded,
      deliveryDays,
      validUntil,
      notes,
      status: existing?.status || 'enviada',
      convertedProjectId: existing?.convertedProjectId,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await upsertQuote(quoteObj);
    showToast(
      existing ? 'Cotización actualizada' : `Cotización ${nextQuoteNum} guardada`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950 font-extrabold">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">
                {existing ? `Editar ${existing.number}` : `Nueva Cotización (${nextQuoteNum})`}
              </h3>
              <p className="text-xs text-slate-400">
                Constructor por ítems con cálculo automático de anticipo
              </p>
            </div>
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
                Título del Presupuesto *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Edición Pack Mensual 8 Reels"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-lime-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Cliente
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm font-semibold focus:outline-none"
              >
                <option value="">Escribir nombre manualmente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!clientId && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nombre del prospecto / cliente
              </label>
              <input
                type="text"
                value={manualClientName}
                onChange={(e) => setManualClientName(e.target.value)}
                placeholder="Ej. Estudio Creativo Norte"
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          {/* Quick Add Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Agregar ítem rápido:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SERVICES.map((srv) => (
                <button
                  key={srv.label}
                  type="button"
                  onClick={() => addItem(srv.description, srv.qty, srv.price)}
                  className="rounded-full bg-slate-100 dark:bg-obsidian-800 hover:bg-lime-accent hover:text-obsidian-950 px-3 py-1 text-xs font-bold transition-colors"
                >
                  {srv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-400">
                Ítems del Presupuesto
              </label>
              <button
                type="button"
                onClick={() => addItem('', 1, 50)}
                className="text-xs font-bold text-lime-accent hover:underline"
              >
                + Añadir línea vacía
              </button>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center rounded-2xl bg-slate-50 dark:bg-obsidian-800/70 p-2.5 border border-slate-200 dark:border-white/5"
              >
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Descripción del servicio..."
                  className="col-span-12 sm:col-span-7 bg-white dark:bg-obsidian-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
                <div className="col-span-4 sm:col-span-2 flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Cant:</span>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full bg-white dark:bg-obsidian-900 rounded-xl px-2 py-2 text-xs font-bold text-center focus:outline-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2 flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">{settings.currency}</span>
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full bg-white dark:bg-obsidian-900 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Format, Deposit %, Revisions, Delivery Days */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Formato Principal
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value as ProjectFormat)}
                className="w-full rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-2 text-xs font-bold"
              >
                <option value="Reel/TikTok">Reel/TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Foto">Foto</option>
                <option value="Diseño">Diseño</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Anticipo (%)
              </label>
              <select
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-2 text-xs font-bold text-lime-accent"
              >
                <option value={30}>30% para iniciar</option>
                <option value={50}>50% para iniciar</option>
                <option value={70}>70% para iniciar</option>
                <option value={100}>100% por adelantado</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Revisiones Incl.
              </label>
              <input
                type="number"
                min={0}
                value={revisionsIncluded}
                onChange={(e) => setRevisionsIncluded(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Entrega (días)
              </label>
              <input
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Notas y condiciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 px-3.5 py-2 text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Live Totals Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-obsidian-950 text-white p-4">
            <div>
              <span className="text-xs text-slate-400">Total Cotización</span>
              <p className="font-display text-2xl font-extrabold text-lime-accent">
                {settings.currency}
                {total.toLocaleString('es-ES')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">
                Anticipo ({depositPercent}%) para arrancar:
              </span>
              <p className="font-display text-lg font-bold text-white">
                {settings.currency}
                {depositAmount.toLocaleString('es-ES')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
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
              Guardar Cotización
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const QuotesView: React.FC = () => {
  const {
    quotes,
    projects,
    clients,
    settings,
    quickFilters,
    deleteQuote,
    convertQuoteToProject,
    setSelectedProjectId,
    setActiveTab,
    showToast,
  } = useStudio();

  const [creatingQuote, setCreatingQuote] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [depositToggleMap, setDepositToggleMap] = useState<Record<string, boolean>>({});

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  // Monthly payment totals across projects
  const financialStats = useMemo(() => {
    const today = new Date();
    const billable = projects.filter((p) => p.status !== 'por_cotizar');

    const collectedMonth = billable
      .filter((p) => {
        try {
          return isSameMonth(parseISO(p.dueDate), today);
        } catch {
          return true;
        }
      })
      .reduce((s, p) => s + p.amountPaid, 0);

    const pendingTotal = billable.reduce(
      (s, p) => s + Math.max(0, p.price - p.amountPaid),
      0
    );

    const unpaidProjects = billable.filter((p) => p.paymentStatus === 'sin_pagar').length;
    const depositProjects = billable.filter((p) => p.paymentStatus === 'anticipo').length;
    const paidProjects = billable.filter((p) => p.paymentStatus === 'pagado').length;

    return {
      collectedMonth,
      pendingTotal,
      unpaidProjects,
      depositProjects,
      paidProjects,
    };
  }, [projects]);

  const filteredQuotes = useMemo(() => {
    const q = quickFilters.searchQuery.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (qt) =>
        qt.title.toLowerCase().includes(q) ||
        qt.number.toLowerCase().includes(q) ||
        qt.clientNameSnapshot.toLowerCase().includes(q)
    );
  }, [quotes, quickFilters.searchQuery]);

  const buildWhatsAppSummary = (quote: Quote) => {
    const total = quote.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const deposit = Math.round((total * quote.depositPercent) / 100);
    const lines = quote.items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.description}: *${settings.currency}${(
            i.quantity * i.unitPrice
          ).toLocaleString('es-ES')}*`
      )
      .join('\n');

    return (
      `🎬 *PRESUPUESTO ${quote.number} — ${settings.studioName}*\n` +
      `📌 *Proyecto:* ${quote.title}\n` +
      `👤 *Cliente:* ${quote.clientNameSnapshot}\n\n` +
      `*Detalle de servicios:*\n${lines}\n\n` +
      `💰 *TOTAL:* ${settings.currency}${total.toLocaleString('es-ES')}\n` +
      `🚀 *Anticipo para iniciar (${quote.depositPercent}%):* ${settings.currency}${deposit.toLocaleString('es-ES')}\n` +
      `🔄 *Revisiones incluidas:* ${quote.revisionsIncluded} rondas\n` +
      `⏱️ *Entrega estimada:* ${quote.deliveryDays} días hábiles\n` +
      (quote.notes ? `\n_${quote.notes}_` : '')
    );
  };

  const copySummaryToClipboard = async (quote: Quote) => {
    const text = buildWhatsAppSummary(quote);
    await navigator.clipboard.writeText(text);
    showToast('Resumen copiado listo para pegar en WhatsApp 📋', 'success');
  };

  const sendSummaryWhatsApp = (quote: Quote) => {
    const client = clientMap.get(quote.clientId);
    const cleanPhone = (client?.phone || '').replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(buildWhatsAppSummary(quote));
    window.open(
      cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`,
      '_blank'
    );
  };

  const handleOneClickConvert = async (quote: Quote) => {
    const withDeposit = depositToggleMap[quote.id] ?? true;
    const created = await convertQuoteToProject(quote.id, withDeposit);
    if (created) {
      setSelectedProjectId(created.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-lime-accent" />
            Cotizador y Control de Pagos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Arma presupuestos en segundos, exporta PDF, copia para WhatsApp y conviértelos al Kanban en 1 clic.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreatingQuote(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-2xl bg-lime-accent px-4 py-2.5 text-sm font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover"
        >
          <Plus className="h-4 w-4 stroke-[2.6]" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Monthly Financial Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[26px] bg-lime-accent text-obsidian-950 p-5 shadow-glow-lime">
          <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
            Cobrado en {format(new Date(), 'MMMM', { locale: es })}
          </span>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {settings.currency}
            {financialStats.collectedMonth.toLocaleString('es-ES')}
          </p>
          <p className="mt-2 text-xs font-bold">
            {financialStats.paidProjects} proyectos pagados al 100%
          </p>
        </div>

        <div className="rounded-[26px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Saldo Pendiente por Cobrar
          </span>
          <p className="mt-1 font-display text-3xl font-extrabold text-tangerine-accent">
            {settings.currency}
            {financialStats.pendingTotal.toLocaleString('es-ES')}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {financialStats.unpaidProjects} sin pagar • {financialStats.depositProjects} con anticipo
          </p>
        </div>

        <div className="rounded-[26px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Estado de Proyectos Activos
            </span>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-400">
                Sin pagar: {financialStats.unpaidProjects}
              </span>
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-400">
                Anticipo: {financialStats.depositProjects}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                Pagado: {financialStats.paidProjects}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className="mt-3 text-left text-xs font-bold text-lime-accent hover:underline"
          >
            Ver tarjetas en el Kanban →
          </button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-accent" />
          Presupuestos Creados ({filteredQuotes.length})
        </h3>

        {filteredQuotes.length === 0 ? (
          <div className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-10 text-center">
            <p className="text-sm text-slate-400">
              Aún no hay cotizaciones registradas. Crea una nueva arriba.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredQuotes.map((quote) => {
              const total = quote.items.reduce(
                (s, i) => s + i.quantity * i.unitPrice,
                0
              );
              const deposit = Math.round((total * quote.depositPercent) / 100);
              const client = clientMap.get(quote.clientId);
              const includeDeposit = depositToggleMap[quote.id] ?? true;

              return (
                <div
                  key={quote.id}
                  className="rounded-[28px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-obsidian-800 px-2.5 py-0.5 text-[11px] font-extrabold text-lime-accent">
                            {quote.number}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              quote.status === 'aprobada'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-violet-accent/15 text-violet-300'
                            }`}
                          >
                            {quote.status === 'aprobada'
                              ? '✓ Aprobada en Kanban'
                              : 'Pendiente aprobación'}
                          </span>
                        </div>

                        <h4 className="mt-2 font-display text-lg font-bold">
                          {quote.title}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {quote.clientNameSnapshot} • {quote.format} •{' '}
                          {quote.revisionsIncluded} revisiones incl.
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingQuote(quote)}
                          className="rounded-xl bg-slate-100 dark:bg-obsidian-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-lime-accent"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuote(quote.id)}
                          className="rounded-xl bg-slate-100 dark:bg-obsidian-800 p-1.5 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Items Breakdown */}
                    <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-obsidian-800/70 p-3.5 space-y-1.5">
                      {quote.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-700 dark:text-slate-200 truncate pr-2">
                            {it.quantity}x {it.description}
                          </span>
                          <span className="font-bold shrink-0">
                            {settings.currency}
                            {(it.quantity * it.unitPrice).toLocaleString('es-ES')}
                          </span>
                        </div>
                      ))}

                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400">
                            Anticipo {quote.depositPercent}%:{' '}
                            <strong className="text-slate-700 dark:text-white">
                              {settings.currency}
                              {deposit.toLocaleString('es-ES')}
                            </strong>
                          </span>
                        </div>
                        <span className="font-display text-lg font-extrabold text-emerald-600 dark:text-lime-accent">
                          Total: {settings.currency}
                          {total.toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: PDF + Copy WhatsApp + 1-Click Convert */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => generateQuotePdf(quote, settings, client)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-800 hover:border-lime-accent border border-transparent px-3 py-2.5 text-xs font-bold transition-colors"
                      >
                        <Download className="h-4 w-4 text-lime-accent" />
                        <span>Descargar PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copySummaryToClipboard(quote)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-800 hover:border-violet-accent border border-transparent px-3 py-2.5 text-xs font-bold transition-colors"
                      >
                        <Copy className="h-4 w-4 text-violet-400" />
                        <span>Copiar WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => sendSummaryWhatsApp(quote)}
                        title="Enviar directo a WhatsApp"
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 1-Click Conversion to Kanban */}
                    {quote.convertedProjectId ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(quote.convertedProjectId!)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-xs font-extrabold text-emerald-400 hover:bg-emerald-500/25"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Abrir Proyecto Creado en el Kanban ↗</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-400 px-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeDeposit}
                            onChange={(e) =>
                              setDepositToggleMap((m) => ({
                                ...m,
                                [quote.id]: e.target.checked,
                              }))
                            }
                            className="accent-lime-accent rounded"
                          />
                          <span>Marcar anticipo recibido ({quote.depositPercent}%)</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleOneClickConvert(quote)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-lime-accent py-2.5 px-4 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover transition-all"
                        >
                          <Zap className="h-4 w-4 fill-obsidian-950" />
                          <span>Aprobar y Pasar al Kanban (1 clic)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(creatingQuote || editingQuote) && (
        <QuoteBuilderModal
          existing={editingQuote}
          onClose={() => {
            setCreatingQuote(false);
            setEditingQuote(null);
          }}
        />
      )}
    </div>
  );
};
