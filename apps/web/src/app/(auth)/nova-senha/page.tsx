import type { Metadata } from 'next';
import { NovaSenhaForm } from './form';

export const metadata: Metadata = { title: 'Nova senha' };

export default function NovaSenhaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-9 font-medium tracking-tight">Nova senha</h1>
        <p className="text-body text-ink-muted">Defina a senha que voce vai usar a partir de agora.</p>
      </div>
      <NovaSenhaForm />
    </div>
  );
}
