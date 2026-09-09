import type { Metadata } from 'next';
import Link from 'next/link';
import { RecoverForm } from './form';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function RecuperarSenhaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-9 font-medium tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-body text-ink-muted">
          Enviamos um link para voce definir uma nova senha.
        </p>
      </div>

      <RecoverForm />

      <p className="text-body text-ink-muted text-center">
        Lembrou?{' '}
        <Link href="/entrar" className="text-ink underline underline-offset-2 hover:text-accent">
          Entrar
        </Link>
      </p>
    </div>
  );
}
