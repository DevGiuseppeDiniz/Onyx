import type { Metadata } from 'next';
import { getActiveContext } from '@/lib/context';
import { PageHeader } from '@/components/shell/page';
import { ROLE_LABELS } from '@onyx/core';

export const metadata: Metadata = { title: 'Configuracoes' };

export default async function ConfiguracoesPage() {
  const { org, roles } = await getActiveContext();

  const linhas = [
    { label: 'Nome', valor: org.name },
    { label: 'Identificador', valor: org.slug },
    { label: 'Tipo', valor: org.kind === 'gym' ? 'Academia' : 'Individual' },
    { label: 'Seu papel', valor: roles.map((r) => ROLE_LABELS[r]).join(' · ') },
  ];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-8">
        <PageHeader titulo="Configuracoes" descricao="Dados da entidade e do seu acesso." />
        <div className="card divide-y divide-[var(--color-line)]">
          {linhas.map(({ label, valor }) => (
            <div key={label} className="flex items-center justify-between gap-6 px-4 h-12">
              <span className="label-micro">{label}</span>
              <span className="text-body text-ink truncate">{valor}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
