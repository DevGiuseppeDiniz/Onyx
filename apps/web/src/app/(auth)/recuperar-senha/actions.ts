'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { emailSchema } from '@onyx/core';

export type RecoverState = { error?: string; emailError?: string; sent?: string };

export async function requestPasswordReset(
  _prev: RecoverState,
  formData: FormData,
): Promise<RecoverState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { emailError: 'E-mail invalido' };

  const supabase = await createClient();
  const origem = (await headers()).get('origin') ?? '';

  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origem}/nova-senha`,
  });

  // Resposta identica exista a conta ou nao: dizer "e-mail nao encontrado"
  // entrega a quem tenta adivinhar quais e-mails estao cadastrados.
  return { sent: parsed.data };
}
