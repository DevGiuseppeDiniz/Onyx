'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Dois idiomas, de proposito:
 *
 *  dense — dashboard. Rotulo em CAIXA ALTA de 11px, input de 32px. Densidade
 *          alta, muita coisa na tela, o olho varre.
 *  form  — telas de entrada e formularios longos. Rotulo em sentence case,
 *          input de 40px. Uma tarefa por vez, sem pressa.
 *
 * Usar o idioma denso numa tela de login faz o formulario parecer um painel
 * de configuracao. Foi o erro que essas telas tinham antes.
 */
type Tone = 'dense' | 'form';

export function Input({
  size = 'md',
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'size'> & { size?: 'md' | 'lg' }) {
  return (
    <input
      className={cn(
        'w-full rounded-[var(--radius-control)] px-3',
        size === 'lg' ? 'h-10 text-lead' : 'h-8 text-body',
        'bg-raised border border-line text-ink',
        'placeholder:text-ink-subtle',
        'transition-colors duration-150',
        'hover:border-edge',
        'focus:border-edge focus:outline-2 focus:outline-accent focus:outline-offset-1',
        'disabled:opacity-45',
        'aria-[invalid=true]:border-danger/60',
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  tone = 'dense',
  action,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  tone?: Tone;
  /** Link a direita do rotulo -- "Esqueceu a senha?" e afins. */
  action?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className={
            tone === 'dense' ? 'label-micro' : 'text-body font-medium text-ink'
          }
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {/* Erro SUBSTITUI a dica em vez de empilhar: campo que cresce ao errar
          empurra o resto do formulario e desorienta. */}
      {error ? (
        <p className="text-micro text-danger">{error}</p>
      ) : hint ? (
        <p className="text-micro text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-control)] border border-danger/35 bg-danger/8 px-3 py-2 text-body text-danger"
    >
      {children}
    </div>
  );
}

/** Campo de senha com o botao de revelar, como na referencia. */
export function PasswordInput(
  props: Omit<ComponentProps<'input'>, 'size' | 'type'> & { size?: 'md' | 'lg' },
) {
  return (
    <div className="relative">
      <Input {...props} type="password" className="pr-10" data-password />
      <RevealButton />
    </div>
  );
}

/** Client-side puro; separado para o Field seguir sendo server component. */
function RevealButton() {
  return (
    <button
      type="button"
      aria-label="Mostrar senha"
      // O toggle e' feito sem estado React: o botao alterna o type do irmao.
      // Menos codigo e nenhum re-render do formulario inteiro.
      onClick={(e) => {
        const input = e.currentTarget.parentElement?.querySelector<HTMLInputElement>('[data-password]');
        if (!input) return;
        const revelado = input.type === 'text';
        input.type = revelado ? 'password' : 'text';
        e.currentTarget.setAttribute('aria-label', revelado ? 'Mostrar senha' : 'Ocultar senha');
      }}
      className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-[var(--radius-control)] text-ink-subtle hover:text-ink hover:bg-overlay transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
