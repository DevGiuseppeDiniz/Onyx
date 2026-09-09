import type { Metadata } from 'next';
import { MailPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveContext } from '@/lib/context';
import { PageHeader, EmptyState } from '@/components/shell/page';

export const metadata: Metadata = { title: 'Convites pendentes' };

export default async function ConvitesPage() {
  const context = await getActiveContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from('memberships')
    .select('id, display_name, phone, created_at')
    .eq('org_id', context.org.id)
    .eq('status', 'invited')
    .order('created_at', { ascending: false });

  const pendentes = data ?? [];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
        <PageHeader
          titulo="Convites pendentes"
          descricao="Pessoas ja cadastradas que ainda nao resgataram o codigo."
        />
        {pendentes.length === 0 ? (
          <EmptyState
            icon={<MailPlus size={22} strokeWidth={1.5} />}
            titulo="Nenhum convite aberto"
            descricao="Convites gerados aparecem aqui ate a pessoa criar a conta."
          />
        ) : (
          <div className="card divide-y divide-[var(--color-line)]">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 h-12">
                <span className="text-body text-ink truncate">{p.display_name ?? '—'}</span>
                <span className="text-body text-ink-muted" data-numeric>
                  {p.phone ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
