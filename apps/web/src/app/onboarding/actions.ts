'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { onboardingSchema, onboardingToCreateOrgArgs } from '@onyx/core';

export type OnboardingState = {
  error?: string;
  fields?: Partial<Record<'orgName' | 'cnpj', string>>;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // String vazia vira undefined para o .default() do Zod valer -- default so'
  // se aplica a undefined, e '' bateria no .min(2) antes disso.
  const vazio = (v: FormDataEntryValue | null) =>
    typeof v === 'string' && v.trim() !== '' ? v : undefined;

  const parsed = onboardingSchema.safeParse({
    intent: formData.get('intent'),
    orgName: vazio(formData.get('orgName')),
    cnpj: vazio(formData.get('cnpj')),
    alsoTeaches: formData.get('alsoTeaches') === 'on',
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { fields: { orgName: f.orgName?.[0], cnpj: f.cnpj?.[0] } };
  }

  const args = onboardingToCreateOrgArgs(parsed.data);
  const supabase = await createClient();

  // create_organization cria a entidade E o vinculo de dono na mesma
  // transacao. INSERT direto nao funcionaria: quem cria ainda nao tem
  // vinculo, logo policy nenhuma pode autoriza-lo.
  const { error } = await supabase.rpc('create_organization', {
    p_name: args.p_name,
    p_kind: args.p_kind,
    p_roles: args.p_roles,
    ...(args.p_cnpj ? { p_cnpj: args.p_cnpj } : {}),
  });

  if (error) {
    // 22023 e' o errcode que a RPC usa para CNPJ malformado
    if (error.code === '22023') return { fields: { cnpj: error.message } };
    if (error.message.includes('organizations_cnpj_key'))
      return { fields: { cnpj: 'Ja existe uma entidade com este CNPJ.' } };
    return { error: 'Nao foi possivel criar. Tente de novo.' };
  }

  redirect('/app');
}
