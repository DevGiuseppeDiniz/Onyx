'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { acceptInviteSchema } from '@onyx/core';

export type InviteState = { error?: string; codeError?: string };

export async function redeemInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const parsed = acceptInviteSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { codeError: parsed.error.issues[0]?.message ?? 'Codigo invalido' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_invite', { p_code: parsed.data.code });

  if (error) {
    // As mensagens da RPC ja sao voltadas ao usuario final; repasso direto.
    return { codeError: error.message };
  }

  redirect('/app');
}
