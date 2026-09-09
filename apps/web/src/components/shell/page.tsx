import type { ReactNode } from 'react';

/** Cabecalho de pagina: titulo, descricao e acao a direita. */
export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-page font-medium tracking-tight">{titulo}</h1>
        {descricao && <p className="text-body text-ink-muted">{descricao}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

/**
 * Estado vazio com borda tracejada. Tracejado comunica "aqui vai aparecer
 * algo" -- borda solida leria como card vazio, que parece defeito.
 */
export function EmptyState({
  icon,
  titulo,
  descricao,
  acao,
}: {
  icon: ReactNode;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 flex flex-col items-center gap-3 text-center">
      <span className="text-ink-subtle">{icon}</span>
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-lead font-medium text-ink">{titulo}</p>
        <p className="text-body text-ink-muted">{descricao}</p>
      </div>
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

/**
 * Bloco rotulo + valor com tile de icone -- o padrao STATUS / COMPUTE /
 * LAST MIGRATION da referencia.
 */
export function StatTile({
  icon,
  label,
  valor,
}: {
  icon: ReactNode;
  label: string;
  valor: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="icon-tile">{icon}</span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="label-micro">{label}</span>
        <span className="text-lead text-ink truncate" data-numeric>
          {valor}
        </span>
      </span>
    </div>
  );
}
