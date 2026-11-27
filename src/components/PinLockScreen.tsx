import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Film, Lock, ShieldCheck } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export const PinLockScreen: React.FC = () => {
  const { settings, unlockWithPin } = useStudio();
  const [entered, setEntered] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const targetLen = Math.min(6, Math.max(4, settings.pinCode.length || 4));

  const handleDigit = useCallback(
    (digit: string) => {
      if (entered.length >= targetLen) return;
      const next = entered + digit;
      setEntered(next);

      if (next.length === targetLen) {
        const ok = unlockWithPin(next);
        if (!ok) {
          setErrorShake(true);
          if (navigator.vibrate) navigator.vibrate(180);
          setTimeout(() => {
            setErrorShake(false);
            setEntered('');
          }, 420);
        } else {
          setEntered('');
        }
      }
    },
    [entered, targetLen, unlockWithPin]
  );

  const handleBackspace = useCallback(() => {
    setEntered((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setEntered('');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian-950 text-white px-6 select-none overflow-hidden">
      {/* Ambient studio glow */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-violet-accent/20 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-lime-accent/20 blur-[110px]" />

      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Brand Badge */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-lime-accent text-obsidian-950 shadow-glow-lime">
          <Film className="h-8 w-8 stroke-[2.4]" />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          {settings.studioName}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
          <Lock className="h-3.5 w-3.5 text-lime-accent" />
          Ingresa tu PIN de {targetLen} dígitos
        </p>

        {/* PIN Dots */}
        <div
          className={`my-8 flex items-center justify-center gap-4 ${
            errorShake ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: targetLen }).map((_, idx) => {
            const filled = idx < entered.length;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-150 ${
                  errorShake
                    ? 'bg-red-500 scale-110 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : filled
                    ? 'bg-lime-accent scale-110 shadow-[0_0_14px_rgba(217,249,80,0.85)]'
                    : 'bg-obsidian-700 border border-white/15'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Keypad (Bank App Style) */}
        <div className="grid w-full max-w-[290px] grid-cols-3 gap-3.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-800/90 border border-white/5 text-2xl font-bold text-white transition-all active:scale-95 hover:bg-obsidian-700 hover:border-lime-accent/40 focus:outline-none"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-900/70 border border-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all active:scale-95 hover:text-white"
          >
            Borrar
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-800/90 border border-white/5 text-2xl font-bold text-white transition-all active:scale-95 hover:bg-obsidian-700 hover:border-lime-accent/40 focus:outline-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Retroceder"
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-900/70 border border-white/5 text-slate-300 transition-all active:scale-95 hover:text-lime-accent"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {settings.pinCode === '1234' && (
          <div className="mt-7 flex items-center gap-2 rounded-full bg-obsidian-800/90 border border-white/10 px-4 py-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-lime-accent shrink-0" />
            <span>
              PIN inicial: <strong className="text-lime-accent font-mono">1234</strong> (personalízalo en Ajustes)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
