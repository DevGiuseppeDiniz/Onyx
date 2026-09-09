import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const { proximo } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-9 font-medium tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-body text-ink-muted">Entre na sua conta.</p>
      </div>

      {/* Google e Apple entram na fase 2. Nao ha bloco "ou" aqui de proposito:
          divisor sem nada acima e' ruido. */}
      <SignInForm proximo={typeof proximo === 'string' ? proximo : undefined} />

      <div className="flex flex-col gap-2 text-center">
        <p className="text-body text-ink-muted">
          Nao tem conta?{' '}
          <Link href="/criar-conta" className="text-ink underline underline-offset-2 hover:text-accent">
            Criar conta
          </Link>
        </p>
        <p className="text-body text-ink-muted">
          Recebeu um codigo de convite?{' '}
          <Link href="/convite" className="text-ink underline underline-offset-2 hover:text-accent">
            Resgatar
          </Link>
        </p>
      </div>
    </div>
  );
}
