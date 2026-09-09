'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, ClipboardList, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Area = { href: Route; label: string; icon: LucideIcon };

// Rail = areas do produto. Sub-navegacao de cada area vive no painel ao lado.
const GRUPOS: Area[][] = [
  [{ href: '/app', label: 'Visao geral', icon: LayoutGrid }],
  [
    { href: '/app/alunos', label: 'Alunos', icon: Users },
    { href: '/app/treinos', label: 'Treinos', icon: ClipboardList },
  ],
  [{ href: '/app/configuracoes', label: 'Configuracoes', icon: Settings }],
];

export function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Areas"
      className="w-12 shrink-0 border-r border-line flex flex-col items-center py-2 gap-1"
    >
      {GRUPOS.map((grupo, i) => (
        <div
          key={i}
          className={cn(
            'flex flex-col items-center gap-1 w-full',
            i > 0 && 'pt-2 mt-1 border-t border-line',
          )}
        >
          {grupo.map(({ href, label, icon: Icon }) => {
            const ativo = href === '/app' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'grid place-items-center size-8 rounded-[var(--radius-control)]',
                  'transition-colors duration-150',
                  // Ativo e' fundo mais claro, nao cor de acento: acento marca
                  // acao, nao localizacao.
                  ativo ? 'bg-raised text-ink' : 'text-ink-subtle hover:bg-raised hover:text-ink',
                )}
              >
                <Icon size={17} strokeWidth={1.5} />
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
