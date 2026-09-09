import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ActiveContext, OrgRole } from '@onyx/core';

/**
 * Resolve a entidade ativa da sessao. Hoje pega a primeira; o seletor de
 * entidade (a pessoa pode ser professor numa academia e aluno em outra)
 * entra quando houver uma segunda tela para trocar.
 */
export async function getActiveContext(): Promise<ActiveContext> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('memberships')
    .select('id, roles, organizations(id, name, slug, kind)')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.organizations) redirect('/onboarding');

  return {
    membershipId: data.id,
    org: data.organizations,
    roles: data.roles as OrgRole[],
  };
}
