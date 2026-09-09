import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'default' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// Altura 32px no padrao. Parece pequeno isolado; e' o que sustenta a
// densidade do painel. Alvo de 56px e' regra da tela de execucao no app
// do aluno, contexto oposto -- ver DESIGN.md.
const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-micro gap-1.5',
  md: 'h-8 px-3 text-body gap-2',
  // lg so' em tela de entrada e acao primaria isolada, nunca no dashboard
  lg: 'h-10 px-4 text-lead gap-2',
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink border border-accent hover:bg-accent-dim hover:border-accent-dim',
  default:
    'bg-raised text-ink border border-line hover:bg-overlay hover:border-edge',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-raised hover:text-ink',
  danger:
    'bg-transparent text-danger border border-line hover:bg-danger/10 hover:border-danger/40',
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-control)]',
        'font-medium whitespace-nowrap transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1',
        'disabled:opacity-45 disabled:pointer-events-none',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
