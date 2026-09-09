import { Panel } from '@/components/shell/panel';

export default function AlunosLayout({ children }: LayoutProps<'/app/alunos'>) {
  return (
    <>
      <Panel
        titulo="Alunos"
        grupos={[
          { itens: [{ href: '/app/alunos', label: 'Todos' }] },
          {
            titulo: 'Acesso',
            itens: [
              { href: '/app/alunos/convites', label: 'Convites pendentes' },
              { href: '/app/alunos/inativos', label: 'Inativos' },
            ],
          },
        ]}
      />
      {children}
    </>
  );
}
