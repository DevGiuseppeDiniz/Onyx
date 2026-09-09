import type { Metadata } from 'next';
import Link from 'next/link';
import { RedeemForm } from './form';

export const metadata: Metadata = { title: 'Resgatar convite' };

export default function ConvitePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-9 font-medium tracking-tight">
          Resgatar convite
        </h1>
        <p className="text-body text-ink-muted">
          Digite o codigo de 8 caracteres que voce recebeu da academia ou do seu professor.
        </p>
      </div>

      <RedeemForm />

      <p className="text-body text-ink-muted text-center">
        Nao tem codigo?{' '}
        <Link href="/app" className="text-ink underline underline-offset-2 hover:text-accent">
          Ir para o painel
        </Link>
      </p>
    </div>
  );
}
