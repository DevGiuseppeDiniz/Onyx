/** O Supabase responde em ingles; o aluno nao deveria ver isso. */
export function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('user already registered')) return 'Ja existe uma conta com este e-mail.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde um minuto.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Sem conexao. Verifique sua internet.';
  return 'Nao foi possivel concluir. Tente de novo.';
}
