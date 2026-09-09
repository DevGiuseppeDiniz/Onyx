import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Activity,
  BadgeCheck,
  Users,
  UserRoundCog,
  MailPlus,
  CalendarDays,
  UserPlus,
  ClipboardPlus,
  Dumbbell,
  Share2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveContext } from '@/lib/context';
import { StatTile } from '@/components/shell/page';
import { ROLE_LABELS, isSoloAthlete, type OrgRole } from '@onyx/core';

export const metadata: Metadata = { title: 'Visao geral' };

export default async function VisaoGeralPage() {
  const context = await getActiveContext();
  const supabase = await createClient();

  // O RLS ja limita ao que este usuario pode ver -- nao filtro por org aqui
  // de proposito, para a consulta nao "reforcar" no cliente o que o banco
  // ja garante. Duas verdades sobre permissao acabam divergindo.
  const { data: membros } = await supabase
    .from('memberships')
    .select('roles, status, created_at')
    .eq('org_id', context.org.id);

  const lista = membros ?? [];
  const ativos = lista.filter((m) => m.status === 'active');
  const conta = (papel: OrgRole) => ativos.filter((m) => m.roles.includes(papel)).length;
  const pendentes = lista.filter((m) => m.status === 'invited').length;

  const solo = isSoloAthlete(context.org.kind, context.roles);
  const criadaEm = lista.length
    ? new Date(
        lista.reduce((a, b) => (a.created_at < b.created_at ? a : b)).created_at,
      ).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col gap-section">
        {/* ------------------------------- cabecalho */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-page font-medium tracking-tight">{context.org.name}</h1>
              <p className="text-body text-ink-subtle">
                {solo ? 'Treinando por conta propria' : `onyx.app/${context.org.slug}`}
              </p>
            </div>

            {/* Grade de rotulo+valor: 2 colunas, respiro largo. */}
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-7">
              <StatTile
                icon={<Activity size={18} strokeWidth={1.5} />}
                label="Status"
                valor={<span className="text-success">Ativa</span>}
              />
              <StatTile
                icon={<BadgeCheck size={18} strokeWidth={1.5} />}
                label="Seu papel"
                valor={context.roles.map((r) => ROLE_LABELS[r]).join(' · ')}
              />
              {!solo && (
                <>
                  <StatTile
                    icon={<Users size={18} strokeWidth={1.5} />}
                    label="Alunos"
                    valor={conta('student')}
                  />
                  <StatTile
                    icon={<UserRoundCog size={18} strokeWidth={1.5} />}
                    label="Professores"
                    valor={conta('trainer')}
                  />
                  <StatTile
                    icon={<MailPlus size={18} strokeWidth={1.5} />}
                    label="Convites pendentes"
                    valor={pendentes}
                  />
                </>
              )}
              <StatTile
                icon={<CalendarDays size={18} strokeWidth={1.5} />}
                label="Criada em"
                valor={criadaEm}
              />
            </div>
          </div>

          {/* Card lateral, como o "Primary Database" da referencia. */}
          <div className="card p-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center size-9 rounded-[var(--radius-control)] border border-accent/30 text-accent shrink-0">
                <Dumbbell size={17} strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-lead font-medium text-ink truncate">{context.org.name}</p>
                <p className="text-micro text-ink-subtle">
                  {context.org.kind === 'gym' ? 'Academia' : 'Entidade individual'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-line text-micro text-ink-subtle">
              <span data-numeric>{ativos.length} ativos</span>
              <span>·</span>
              <span data-numeric>{pendentes} pendentes</span>
            </div>
          </div>
        </section>

        {/* ------------------------------- atalhos */}
        <section className="flex flex-col gap-5">
          <h2 className="text-section font-medium tracking-tight">Comece por aqui</h2>
          {/* Divisor vertical em vez de borda de card: e' o truque que faz a
              linha parecer leve na referencia. */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-line rounded-[var(--radius-card)] overflow-hidden">
            {(
              [
              {
                href: '/app/alunos',
                icon: UserPlus,
                titulo: 'Cadastrar aluno',
                sub: 'Gera codigo de convite',
              },
              {
                href: '/app/treinos',
                icon: ClipboardPlus,
                titulo: 'Criar treino',
                sub: 'Do zero ou de um template',
              },
              {
                href: '/app/alunos/convites',
                icon: MailPlus,
                titulo: 'Convites pendentes',
                sub: 'Quem ainda nao resgatou',
              },
              {
                href: '/app/configuracoes',
                icon: Share2,
                titulo: 'Convidar professor',
                sub: 'Somente dono e gerente',
              },
            ] satisfies Array<{ href: Route; icon: typeof UserPlus; titulo: string; sub: string }>
            ).map(({ href, icon: Icon, titulo, sub }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col items-center gap-2 px-4 py-8 text-center transition-colors hover:bg-raised/50 ${
                  i > 0 ? 'border-t sm:border-t-0 sm:border-l border-line' : ''
                } ${i === 2 ? 'lg:border-l sm:border-t lg:border-t-0' : ''} ${
                  i === 3 ? 'sm:border-t lg:border-t-0' : ''
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.5}
                  className="text-ink-subtle group-hover:text-accent transition-colors"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body text-ink">{titulo}</span>
                  <span className="text-micro text-ink-subtle">{sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
