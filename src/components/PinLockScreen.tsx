import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      {/* Animated Ambient Studio Glows */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-accent/25 blur-[120px] animate-orb-slow" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-lime-accent/25 blur-[120px] animate-orb-reverse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-sm flex flex-col items-center"
      >
        <motion.div
          whileHover={{ rotate: -8, scale: 1.06 }}
          className="motion-shimmer mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-lime-accent text-obsidian-950 shadow-glow-lime"
        >
          <Film className="h-8 w-8 stroke-[2.4]" />
        </motion.div>

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
              <motion.div
                key={idx}
                animate={filled ? { scale: [1, 1.3, 1.1] } : { scale: 1 }}
                transition={{ duration: 0.18 }}
                className={`h-4 w-4 rounded-full transition-colors duration-150 ${
                  errorShake
                    ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : filled
                    ? 'bg-lime-accent shadow-[0_0_14px_rgba(217,249,80,0.85)]'
                    : 'bg-obsidian-700 border border-white/15'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Keypad */}
        <div className="grid w-full max-w-[290px] grid-cols-3 gap-3.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num, i) => (
            <motion.button
              key={num}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigit(num)}
              className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-800/90 border border-white/5 text-2xl font-bold text-white transition-colors hover:bg-obsidian-700 hover:border-lime-accent/40 focus:outline-none"
            >
              {num}
            </motion.button>
          ))}

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleClear}
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-900/70 border border-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white"
          >
            Borrar
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => handleDigit('0')}
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-800/90 border border-white/5 text-2xl font-bold text-white transition-colors hover:bg-obsidian-700 hover:border-lime-accent/40 focus:outline-none"
          >
            0
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleBackspace}
            aria-label="Retroceder"
            className="flex h-16 w-full items-center justify-center rounded-3xl bg-obsidian-900/70 border border-white/5 text-slate-300 hover:text-lime-accent"
          >
            <Delete className="h-6 w-6" />
          </motion.button>
        </div>

        {settings.pinCode === '1234' && (
          <div className="mt-7 flex items-center gap-2 rounded-full bg-obsidian-800/90 border border-white/10 px-4 py-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-lime-accent shrink-0" />
            <span>
              PIN inicial: <strong className="text-lime-accent font-mono">1234</strong> (personalízalo en Ajustes)
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
