import React, { forwardRef, useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Boxed password input with a leading lock icon and a show/hide eye toggle.
 * Forwards its ref + props to the underlying input so it works with
 * react-hook-form's `register()`.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={ref}
        {...props}
        type={show ? 'text' : 'password'}
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
