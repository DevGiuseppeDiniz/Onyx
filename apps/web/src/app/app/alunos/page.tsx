import type { Metadata } from 'next';
import { Users, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getActiveContext } from '@/lib/context';
import { PageHeader, EmptyState } from '@/components/shell/page';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@onyx/core';

export const metadata: Metadata = { title: 'Alunos' };

export default async function AlunosPage() {
  const context = await getActiveContext();
  const supabase = await createClient();

  // O RLS decide o que aparece: dono ve a entidade toda, professor ve so' os
  // alunos atribuidos a ele. Nenhum filtro extra aqui.
  const { data } = await supabase
    .from('memberships')
    .select('id, user_id, display_name, status, roles, phone')
    .eq('org_id', context.org.id)
    .contains('roles', ['student'])
    .order('created_at', { ascending: false });

  const alunos = data ?? [];

  // PostgREST nao consegue embutir profiles: a FK de memberships.user_id
  // aponta para auth.users, nao para public.profiles. Adicionar uma segunda
  // FK resolveria o embed, mas criaria um segundo ON DELETE SET NULL
  // interagindo com guard_membership_update -- nao vale o risco por um join.
  const ids = alunos.map((a) => a.user_id).filter((v): v is string => Boolean(v));
  const { data: perfis } = ids.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ids)
    : { data: [] };
  const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.full_name]));

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
        <PageHeader
          titulo="Alunos"
          descricao="Cadastre o aluno e monte o treino dele antes mesmo de instalar o app."
          acao={
            <Button variant="primary">
              <UserPlus size={15} strokeWidth={1.5} />
              Cadastrar aluno
            </Button>
          }
        />

        {alunos.length === 0 ? (
          <EmptyState
            icon={<Users size={22} strokeWidth={1.5} />}
            titulo="Nenhum aluno ainda"
            descricao="Ao cadastrar, voce recebe um codigo de 8 caracteres para o aluno digitar no app. Ele nao precisa ter conta antes."
            acao={
              <Button variant="primary">
                <UserPlus size={15} strokeWidth={1.5} />
                Cadastrar o primeiro
              </Button>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left font-normal label-micro px-4 h-9">Nome</th>
                  <th className="text-left font-normal label-micro px-4 h-9">Papeis</th>
                  <th className="text-left font-normal label-micro px-4 h-9">Telefone</th>
                  <th className="text-left font-normal label-micro px-4 h-9">Situacao</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-raised/40">
                    <td className="px-4 h-11 text-ink">
                      {(a.user_id ? nomePorId.get(a.user_id) : null) ?? a.display_name ?? '—'}
                    </td>
                    <td className="px-4 h-11 text-ink-muted">
                      {a.roles.map((r) => ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r).join(' · ')}
                    </td>
                    <td className="px-4 h-11 text-ink-muted" data-numeric>
                      {a.phone ?? '—'}
                    </td>
                    <td className="px-4 h-11">
                      {a.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <span className="size-1.5 rounded-full bg-success" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <span className="size-1.5 rounded-full bg-warning" />
                          Convite pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
