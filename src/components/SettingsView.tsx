import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Moon,
  RefreshCw,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { SUPABASE_SETUP_SQL } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    lockNow,
    syncStatus,
    syncError,
    cloudCredentials,
    connectSupabase,
    disconnectSupabase,
    pushAllToCloud,
    hasSampleData,
    clearSampleData,
    resetAllWorkspaceData,
    exportBackupJson,
    exportBackupCsv,
    importBackupJson,
    showToast,
  } = useStudio();

  const [editorName, setEditorName] = useState(settings.editorName);
  const [studioName, setStudioName] = useState(settings.studioName);
  const [currency, setCurrency] = useState(settings.currency);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [sbUrl, setSbUrl] = useState(cloudCredentials.url);
  const [sbKey, setSbKey] = useState(cloudCredentials.anonKey);
  const [showSql, setShowSql] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditorName(settings.editorName);
    setStudioName(settings.studioName);
    setCurrency(settings.currency);
  }, [settings.editorName, settings.studioName, settings.currency]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      editorName: editorName.trim() || 'Editor',
      studioName: studioName.trim() || 'CutFlow Studio',
      currency: currency || '$',
    });
    showToast('Perfil del estudio actualizado', 'success');
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPin)) {
      showToast('El PIN debe tener entre 4 y 6 dígitos numéricos', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('Los códigos PIN no coinciden', 'error');
      return;
    }
    await updateSettings({ pinCode: newPin, pinEnabled: true });
    setNewPin('');
    setConfirmPin('');
    showToast(`PIN actualizado (${newPin.length} dígitos)`, 'success');
  };

  const handleConnectCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbKey.trim()) {
      showToast('Ingresa el Project URL y la Anon Key de Supabase', 'error');
      return;
    }
    await connectSupabase({ url: sbUrl, anonKey: sbKey });
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    showToast('Script SQL copiado al portapapeles', 'success');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importBackupJson(text);
    e.target.value = '';
  };

  const triggerPwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-lime-accent" />
          Ajustes, Nube y Respaldos
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sincronización en tiempo real entre PC y celular, limpieza de ejemplos, seguridad con PIN y respaldos.
        </p>
      </div>

      {/* =====================================================================
          0. LIMPIEZA DE DATOS DE EJEMPLO / EMPEZAR EN LIMPIO
      ===================================================================== */}
      <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-violet-accent/35 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-accent text-obsidian-950">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">
                Limpiar Datos de Ejemplo / Reiniciar Estudio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Elimina con un clic los proyectos, clientes y cotizaciones de prueba (tanto en pantalla como en Supabase).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={clearSampleData}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-accent px-5 py-2.5 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover transition-transform active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            <span>
              {hasSampleData
                ? 'Borrar solo los datos de ejemplo (Recomendado)'
                : 'Datos de ejemplo ya eliminados ✓'}
            </span>
          </button>

          {!confirmResetAll ? (
            <button
              type="button"
              onClick={() => setConfirmResetAll(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
            >
              <span>Vaciar absolutamente todo el estudio</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await resetAllWorkspaceData();
                  setConfirmResetAll(false);
                }}
                className="rounded-2xl bg-red-500 px-4 py-2.5 text-xs font-extrabold text-white"
              >
                Sí, borrar todo y dejar en blanco
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="rounded-2xl bg-slate-200 dark:bg-obsidian-800 px-3 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          1. SUPABASE CLOUD REAL-TIME DATABASE
      ===================================================================== */}
      <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-accent text-obsidian-950">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">
                Base de Datos en la Nube (Supabase Realtime)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sincroniza automáticamente todos tus proyectos, clientes y cotizaciones entre PC y teléfono.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold border ${
              syncStatus === 'cloud_live'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                : syncStatus === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            {syncStatus === 'cloud_live'
              ? 'Sincronizado en tiempo real'
              : syncStatus === 'connecting'
              ? 'Conectando...'
              : syncStatus === 'error'
              ? 'Requiere atención'
              : 'Pendiente de conectar'}
          </span>
        </div>

        {syncError && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs font-semibold text-red-400">
            ⚠️ {syncError}
          </div>
        )}

        <form onSubmit={handleConnectCloud} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://tu-proyecto.supabase.co"
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-lime-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-lime-accent"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs font-bold hover:border-lime-accent"
              >
                <Copy className="h-3.5 w-3.5 text-lime-accent" />
                <span>1. Copiar Script SQL de Tablas</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSql((s) => !s)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2"
              >
                {showSql ? 'Ocultar SQL' : 'Ver instrucciones SQL'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {syncStatus === 'cloud_live' && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await pushAllToCloud();
                        showToast('Datos sincronizados a Supabase Cloud', 'success');
                      } catch (err: any) {
                        showToast(err.message, 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-obsidian-800 px-3.5 py-2 text-xs font-bold"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-lime-accent" />
                    <span>Forzar Resincronización</span>
                  </button>

                  <button
                    type="button"
                    onClick={disconnectSupabase}
                    className="rounded-2xl bg-red-500/15 px-3.5 py-2 text-xs font-bold text-red-400"
                  >
                    Desconectar
                  </button>
                </>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-lime-accent px-5 py-2.5 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Guardar y Conectar Nube</span>
              </button>
            </div>
          </div>
        </form>

        {showSql && (
          <div className="rounded-2xl bg-obsidian-950 border border-white/10 p-4 space-y-2">
            <p className="text-xs text-slate-300">
              En tu cuenta gratuita de <strong>supabase.com</strong>, abre <strong>SQL Editor → New Query</strong>, pega este código y presiona <strong>Run</strong>:
            </p>
            <pre className="max-h-56 overflow-y-auto rounded-xl bg-black/60 p-3 text-[11px] text-lime-accent font-mono">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. PIN LOCK SECURITY + STUDIO PROFILE
      ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-5 w-5 text-violet-accent" />
              <h3 className="font-display text-lg font-bold">
                Acceso Rápido con PIN
              </h3>
            </div>
            <button
              type="button"
              onClick={lockNow}
              className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian-800 px-3 py-1.5 text-xs font-bold text-lime-accent"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Bloquear ahora</span>
            </button>
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-obsidian-800 p-3.5 cursor-pointer">
            <div>
              <p className="text-sm font-bold">Solicitar PIN al abrir la app</p>
              <p className="text-xs text-slate-400">
                PIN actual de {settings.pinCode.length} dígitos activo
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.pinEnabled}
              onChange={(e) => updateSettings({ pinEnabled: e.target.checked })}
              className="h-5 w-5 accent-lime-accent"
            />
          </label>

          <form onSubmit={handlePinChange} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Nuevo PIN (4 a 6 dígitos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-center font-mono text-base font-bold tracking-widest focus:outline-none focus:border-lime-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-center font-mono text-base font-bold tracking-widest focus:outline-none focus:border-lime-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-violet-accent py-2.5 text-xs font-extrabold text-obsidian-950 hover:bg-violet-hover transition-colors"
            >
              Actualizar Código PIN
            </button>
          </form>
        </section>

        <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">
            Identidad del Editor y Apariencia
          </h3>

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-sm font-bold focus:outline-none"
                >
                  <option value="$">$ (USD / Peso)</option>
                  <option value="US$ ">US$ (Dólares)</option>
                  <option value="MXN $">MXN $ (Pesos MX)</option>
                  <option value="€">€ (Euros)</option>
                  <option value="S/ ">S/ (Soles)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Nombre del Estudio (para PDFs, Recibos y Portal)
              </label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-sm font-semibold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold border ${
                  settings.theme === 'dark'
                    ? 'bg-obsidian-950 text-lime-accent border-lime-accent'
                    : 'bg-slate-100 text-slate-600 border-transparent'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Oscuro (Estudio)</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold border ${
                  settings.theme === 'light'
                    ? 'bg-lime-accent text-obsidian-950 border-lime-accent font-extrabold'
                    : 'bg-obsidian-800 text-slate-300 border-transparent'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Claro</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-lime-accent py-2.5 text-xs font-extrabold text-obsidian-950 shadow-glow-lime"
            >
              Guardar Preferencias
            </button>
          </form>
        </section>
      </div>

      {/* =====================================================================
          3. FAST BACKUP (JSON / CSV) + PWA INSTALL
      ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 space-y-4">
          <h3 className="font-display text-lg font-bold">
            Respaldo Rápido y Exportación
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Descarga en un clic todos tus clientes, proyectos y cotizaciones en JSON o en CSV compatible con Excel / Google Sheets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={exportBackupJson}
              className="flex items-center justify-center gap-2 rounded-2xl bg-lime-accent px-4 py-3 text-xs font-extrabold text-obsidian-950 shadow-glow-lime hover:bg-lime-hover"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Todo (JSON)</span>
            </button>

            <button
              type="button"
              onClick={exportBackupCsv}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 px-4 py-3 text-xs font-bold hover:border-lime-accent"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>

          <div className="pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-300 hover:border-lime-accent"
            >
              <Upload className="h-4 w-4" />
              <span>Restaurar desde archivo JSON</span>
            </button>
          </div>
        </section>

        <section className="rounded-[30px] bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-5 w-5 text-lime-accent" />
              <h3 className="font-display text-lg font-bold">
                Modo App Nativa (PWA Instalable)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Esta aplicación está configurada como Progressive Web App para abrirse a pantalla completa sin barras del navegador:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc">
              <li>
                <strong>Android / Chrome / Edge:</strong> Toca el botón inferior o el menú ⋮ → <em>"Instalar aplicación"</em>.
              </li>
              <li>
                <strong>iPhone (Safari):</strong> Toca el botón <em>Compartir</em> → <em>"Agregar a pantalla de inicio"</em>.
              </li>
            </ul>
          </div>

          {deferredPrompt ? (
            <button
              type="button"
              onClick={triggerPwaInstall}
              className="w-full rounded-2xl bg-lime-accent py-3 text-xs font-extrabold text-obsidian-950 shadow-glow-lime"
            >
              📲 Instalar App en Pantalla de Inicio
            </button>
          ) : (
            <div className="rounded-2xl bg-slate-100 dark:bg-obsidian-800 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-300 text-center">
              ✓ Manifest PWA y Service Worker activos
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
