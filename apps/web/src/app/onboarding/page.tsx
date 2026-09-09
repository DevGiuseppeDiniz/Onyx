import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from './form';

export const metadata: Metadata = { title: 'Configurar' };

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Quem ja tem vinculo nao passa por aqui de novo -- o RLS ja limita o
  // select aos vinculos visiveis, entao count > 0 significa "meu".
  const { data } = await supabase.from('memberships').select('id').limit(1);
  if (data && data.length > 0) redirect('/app');

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-12 flex items-center px-4 border-b border-line">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-5 rounded-[4px] bg-accent grid place-items-center">
            <span className="size-2 rounded-[1px] bg-accent-ink rotate-45" />
          </span>
          <span className="text-lead font-medium tracking-tight">Onyx</span>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-[560px] flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-page font-medium tracking-tight">Como voce usa o Onyx?</h1>
            <p className="text-body text-ink-muted">
              Da para mudar depois. Isso so' define o que aparece primeiro.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
