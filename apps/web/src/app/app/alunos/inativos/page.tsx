import type { Metadata } from 'next';
import { UserRoundX } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveContext } from '@/lib/context';
import { PageHeader, EmptyState } from '@/components/shell/page';

export const metadata: Metadata = { title: 'Inativos' };

export default async function InativosPage() {
  const context = await getActiveContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from('memberships')
    .select('id, display_name')
    .eq('org_id', context.org.id)
    .eq('status', 'inactive')
    .contains('roles', ['student']);

  const inativos = data ?? [];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
        <PageHeader
          titulo="Inativos"
          descricao="Alunos desligados e contas excluidas. O historico de treino permanece."
        />
        {inativos.length === 0 ? (
          <EmptyState
            icon={<UserRoundX size={22} strokeWidth={1.5} />}
            titulo="Ninguem inativo"
            descricao="Quem sai da entidade ou exclui a conta aparece aqui, anonimizado."
          />
        ) : (
          <div className="card divide-y divide-[var(--color-line)]">
            {inativos.map((p) => (
              <div key={p.id} className="flex items-center px-4 h-12">
                <span className="text-body text-ink-muted">{p.display_name ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
