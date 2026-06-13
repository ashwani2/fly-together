import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export type SwalVariant = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface SwalOptions {
  title?: string;
  message?: string;
  variant?: SwalVariant;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface SwalState extends SwalOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

const queue: SwalState[] = [];
let counter = 0;
let host: ((s: SwalState | null) => void) | null = null;

const emit = () => host?.(queue[0] ?? null);

function fire(options: SwalOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue.push({ id: ++counter, variant: 'info', ...options, resolve });
    emit();
  });
}

function resolveTop(confirmed: boolean) {
  const top = queue.shift();
  top?.resolve(confirmed);
  emit();
}

/** Imperative, SweetAlert-style dialogs. Themed to match the app. */
export const swal = {
  fire,
  success: (message: string, title = 'Success') => fire({ variant: 'success', title, message }),
  error: (message: string, title = 'Something went wrong') => fire({ variant: 'error', title, message }),
  warning: (message: string, title = 'Heads up') => fire({ variant: 'warning', title, message }),
  info: (message: string, title = 'Notice') => fire({ variant: 'info', title, message }),
  confirm: (message: string, opts?: Partial<SwalOptions>) =>
    fire({
      variant: 'question',
      title: 'Are you sure?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true,
      message,
      ...opts,
    }),
};

const VARIANT_STYLES: Record<SwalVariant, { icon: React.ComponentType<{ className?: string }>; ring: string; text: string; btn: string }> = {
  success: { icon: CheckCircle2, ring: 'bg-green-500/10 text-green-600', text: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
  error: { icon: XCircle, ring: 'bg-red-500/10 text-red-600', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
  warning: { icon: AlertTriangle, ring: 'bg-amber-500/10 text-amber-600', text: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' },
  info: { icon: Info, ring: 'bg-primary/10 text-primary', text: 'text-primary', btn: 'bg-primary hover:bg-primary/90' },
  question: { icon: HelpCircle, ring: 'bg-primary/10 text-primary', text: 'text-primary', btn: 'bg-primary hover:bg-primary/90' },
};

export function SwalHost() {
  const [state, setState] = useState<SwalState | null>(null);

  useEffect(() => {
    host = setState;
    return () => {
      if (host === setState) host = null;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveTop(false);
      if (e.key === 'Enter') resolveTop(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  if (typeof document === 'undefined') return null;

  const v = state ? VARIANT_STYLES[state.variant ?? 'info'] : null;
  const Icon = v?.icon ?? Info;

  return createPortal(
    <AnimatePresence>
      {state && v && (
        <motion.div
          key={state.id}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => resolveTop(state.showCancel ? false : true)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-7 text-center shadow-2xl"
            role="alertdialog"
            aria-modal="true"
          >
            <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full ${v.ring}`}>
              <Icon className="h-9 w-9" />
            </div>
            {state.title && <h2 className="text-xl font-bold tracking-tight text-foreground">{state.title}</h2>}
            {state.message && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.message}</p>}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              {state.showCancel && (
                <button
                  onClick={() => resolveTop(false)}
                  className="h-11 rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:min-w-[120px]"
                >
                  {state.cancelText ?? 'Cancel'}
                </button>
              )}
              <button
                autoFocus
                onClick={() => resolveTop(true)}
                className={`h-11 rounded-full px-6 text-sm font-semibold text-white shadow-lg transition-colors sm:min-w-[120px] ${v.btn}`}
              >
                {state.confirmText ?? 'OK'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
