'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PanelGroup = {
  /** Header em caixa alta. Omitir no primeiro grupo, como na referencia. */
  titulo?: string;
  itens: Array<{ href: Route; label: string; badge?: ReactNode }>;
};

/**
 * Painel contextual: sub-navegacao da area ativa. So' aparece onde a area
 * tem mais de uma tela -- painel com um item so' e' moldura vazia.
 */
export function Panel({ titulo, grupos }: { titulo: string; grupos: PanelGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-line flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-line">
        <h2 className="text-lead font-medium tracking-tight">{titulo}</h2>
      </div>

      <div className="flex flex-col gap-5 p-3 overflow-y-auto">
        {grupos.map((grupo, i) => (
          <div key={i} className="flex flex-col gap-1">
            {grupo.titulo && <p className="label-micro px-2 pb-1">{grupo.titulo}</p>}
            {grupo.itens.map(({ href, label, badge }) => {
              const ativo = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={ativo ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between gap-2 h-8 px-2 rounded-[var(--radius-control)]',
                    'text-body transition-colors duration-150',
                    ativo ? 'bg-raised text-ink' : 'text-ink-muted hover:bg-raised/60 hover:text-ink',
                  )}
                >
                  {label}
                  {badge}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
