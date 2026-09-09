import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from './form';

export const metadata: Metadata = { title: 'Criar conta' };

export default function CriarContaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-9 font-medium tracking-tight">Criar conta</h1>
        <p className="text-body text-ink-muted">
          No proximo passo voce escolhe como usa o Onyx.
        </p>
      </div>

      <SignUpForm />

      <p className="text-body text-ink-muted text-center">
        Ja tem conta?{' '}
        <Link href="/entrar" className="text-ink underline underline-offset-2 hover:text-accent">
          Entrar
        </Link>
      </p>
    </div>
  );
}
