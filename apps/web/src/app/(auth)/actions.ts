'use server';

import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { createClient } from '@/lib/supabase/server';
import { credentialsSchema, signUpSchema } from '@onyx/core';

export type AuthState = {
  error?: string;
  fields?: Partial<Record<'email' | 'password' | 'fullName', string>>;
  /** Projeto com confirmacao de e-mail ligada: nao ha sessao ainda. */
  confirmEmail?: string;
};

/** O Supabase responde em ingles; o usuario nao deveria ver isso. */
function traduzir(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('user already registered')) return 'Ja existe uma conta com este e-mail.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde um minuto.';
  if (m.includes('password')) return 'Senha muito curta ou fraca.';
  return 'Nao foi possivel concluir. Tente de novo.';
}

/**
 * Onde a pessoa deve cair depois de autenticar. Quem ainda nao tem vinculo
 * ativo em entidade nenhuma precisa passar pelo onboarding -- e' o caso do
 * dono de academia, do personal MEI e do entusiasta no primeiro acesso.
 */
async function destino(): Promise<Route> {
  const supabase = await createClient();
  const { data } = await supabase.from('memberships').select('id').limit(1);
  return data && data.length > 0 ? '/app' : '/onboarding';
}

/**
 * O proxy guarda em `?proximo=` a rota que a pessoa tentou abrir sem sessao.
 * Aceito somente caminho interno: sem esta checagem, `?proximo=https://...`
 * transforma o login em open redirect e vira isca de phishing.
 */
function destinoSeguro(valor: FormDataEntryValue | null): Route | null {
  if (typeof valor !== 'string') return null;
  if (!valor.startsWith('/') || valor.startsWith('//')) return null;
  return valor as Route;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fields: { email: f.email?.[0], password: f.password?.[0] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: traduzir(error.message) };

  redirect(destinoSeguro(formData.get('proximo')) ?? (await destino()));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fields: {
        fullName: f.fullName?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // Lido pelo trigger on_auth_user_created, que cria a linha em profiles.
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { error: traduzir(error.message) };

  // Com "Confirm email" ligado (padrao em projeto novo) nao vem sessao:
  // a pessoa precisa clicar no link antes de continuar.
  if (!data.session) return { confirmEmail: parsed.data.email };

  redirect('/onboarding');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/entrar');
}
