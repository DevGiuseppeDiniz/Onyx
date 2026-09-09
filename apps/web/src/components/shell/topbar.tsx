import { ChevronRight } from 'lucide-react';
import { signOut } from '@/app/(auth)/actions';
import type { ActiveContext } from '@onyx/core';
import { ROLE_LABELS } from '@onyx/core';

/** Pilula minuscula do breadcrumb: FREE, PRODUCTION na referencia. */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-1.5 py-px text-[0.625rem] uppercase tracking-wider text-ink-subtle">
      {children}
    </span>
  );
}

export function Topbar({ context }: { context: ActiveContext }) {
  const papel = context.roles.includes('owner')
    ? ROLE_LABELS.owner
    : context.roles.includes('trainer')
      ? ROLE_LABELS.trainer
      : ROLE_LABELS[context.roles[0] ?? 'student'];

  return (
    <header className="h-12 shrink-0 border-b border-line flex items-center justify-between gap-4 px-3">
      <div className="flex items-center gap-2 min-w-0">
        <span aria-hidden className="size-5 rounded-[4px] bg-accent grid place-items-center shrink-0">
          <span className="size-2 rounded-[1px] bg-accent-ink rotate-45" />
        </span>
        <ChevronRight size={13} className="text-ink-subtle shrink-0" strokeWidth={1.5} />
        <span className="text-body text-ink truncate">{context.org.name}</span>
        <Badge>{context.org.kind === 'gym' ? 'Academia' : 'Individual'}</Badge>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-micro text-ink-subtle">{papel}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="h-7 px-2.5 rounded-[var(--radius-control)] text-body text-ink-muted hover:text-ink hover:bg-raised transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
