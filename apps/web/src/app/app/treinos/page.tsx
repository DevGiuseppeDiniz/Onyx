import type { Metadata } from 'next';
import { ClipboardList, ClipboardPlus } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shell/page';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Treinos' };

export default function TreinosPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
        <PageHeader
          titulo="Treinos"
          descricao="Monte a rotina uma vez e atribua para quantos alunos precisar."
          acao={
            <Button variant="primary">
              <ClipboardPlus size={15} strokeWidth={1.5} />
              Criar treino
            </Button>
          }
        />
        <EmptyState
          icon={<ClipboardList size={22} strokeWidth={1.5} />}
          titulo="Nenhum treino ainda"
          descricao="O editor de treinos e a biblioteca de exercicios entram na proxima etapa."
        />
      </div>
    </main>
  );
}
