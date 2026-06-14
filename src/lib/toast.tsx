import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number;
}

let counter = 0;
let host: ((updater: (prev: ToastState[]) => ToastState[]) => void) | null = null;

function push(variant: ToastVariant, message: string, title?: string, duration = 4000) {
  const item: ToastState = { id: ++counter, variant, message, title, duration };
  host?.((prev) => [...prev, item]);
}

/** Non-blocking corner toasts. Auto-dismiss; stack newest at the bottom. */
export const toast = {
  success: (message: string, title?: string) => push('success', message, title),
  error: (message: string, title?: string) => push('error', message, title),
  warning: (message: string, title?: string) => push('warning', message, title),
  info: (message: string, title?: string) => push('info', message, title),
};

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ComponentType<{ className?: string }>; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'bg-green-500', ring: 'text-green-600' },
  error: { icon: XCircle, accent: 'bg-red-500', ring: 'text-red-600' },
  warning: { icon: AlertTriangle, accent: 'bg-amber-500', ring: 'text-amber-600' },
  info: { icon: Info, accent: 'bg-primary', ring: 'text-primary' },
};

export function ToastHost() {
  const [items, setItems] = useState<ToastState[]>([]);
  const timers = useRef<Set<number>>(new Set());

  useEffect(() => {
    host = setItems;
    return () => {
      if (host === setItems) host = null;
    };
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  // Schedule each toast's auto-dismiss exactly once.
  useEffect(() => {
    items.forEach((it) => {
      if (timers.current.has(it.id)) return;
      timers.current.add(it.id);
      setTimeout(() => {
        remove(it.id);
        timers.current.delete(it.id);
      }, it.duration);
    });
  }, [items]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[210] flex flex-col items-end gap-3">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const v = VARIANT_STYLES[item.variant];
          const Icon = v.icon;
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="pointer-events-auto relative flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 pr-9 shadow-2xl"
              role="status"
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${v.accent}`} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${v.ring}`} />
              <div className="min-w-0 flex-1">
                {item.title && <p className="text-sm font-semibold text-foreground">{item.title}</p>}
                <p className="text-sm leading-relaxed text-muted-foreground break-words">{item.message}</p>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="absolute top-2.5 right-2.5 grid h-5 w-5 place-items-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
