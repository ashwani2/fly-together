import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** Value as yyyy-MM-dd. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  /** Latest selectable date (e.g. today for a DOB). */
  max?: Date;
  /** Earliest navigable year. */
  fromYear?: number;
}

const POP_WIDTH = 268;
const POP_HEIGHT = 320;

export function DatePicker({ value, onChange, placeholder = 'Select date', id, max, fromYear = 1940 }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const endMonth = max ?? new Date();

  const computePosition = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const spaceAbove = r.top;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceAbove >= POP_HEIGHT || spaceAbove > spaceBelow;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - POP_WIDTH - 8));
    if (openUp) {
      setCoords({ left, bottom: window.innerHeight - r.top + 8 });
    } else {
      setCoords({ left, top: r.bottom + 8 });
    }
  };

  useLayoutEffect(() => {
    if (open) computePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => computePosition();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !selected && 'text-muted-foreground',
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{selected ? format(selected, 'PPP') : placeholder}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popRef}
            className="ft-datepicker fixed z-[200] rounded-2xl border border-border/60 bg-popover/70 p-2 shadow-2xl backdrop-blur-xl"
            style={
              {
                left: coords.left,
                top: coords.top,
                bottom: coords.bottom,
                '--rdp-accent-color': 'var(--primary)',
                '--rdp-accent-background-color': 'color-mix(in oklch, var(--primary) 14%, transparent)',
                '--rdp-day-width': '1.85rem',
                '--rdp-day-height': '1.85rem',
                '--rdp-day_button-width': '1.85rem',
                '--rdp-day_button-height': '1.85rem',
              } as React.CSSProperties
            }
          >
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected ?? new Date(2000, 0)}
              captionLayout="dropdown"
              fixedWeeks
              showOutsideDays
              startMonth={new Date(fromYear, 0)}
              endMonth={endMonth}
              disabled={{ after: endMonth }}
              onSelect={(d) => {
                if (d) {
                  onChange(format(d, 'yyyy-MM-dd'));
                  setOpen(false);
                }
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
