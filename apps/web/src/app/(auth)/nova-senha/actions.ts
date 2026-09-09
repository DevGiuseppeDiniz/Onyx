'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { passwordSchema } from '@onyx/core';

export type NovaSenhaState = { error?: string; senhaError?: string };

export async function setNewPassword(
  _prev: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const senha = formData.get('password');
  const confirma = formData.get('confirm');

  const parsed = passwordSchema.safeParse(senha);
  if (!parsed.success) return { senhaError: parsed.error.issues[0]?.message };
  if (senha !== confirma) return { senhaError: 'As senhas nao conferem.' };

  const supabase = await createClient();

  // O link do e-mail traz a sessao de recuperacao; sem ela nao ha o que
  // atualizar. Acontece quando o link expira ou ja foi usado.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Link expirado ou ja utilizado. Peca um novo.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: 'Nao foi possivel alterar. Tente de novo.' };

  redirect('/app');
}
