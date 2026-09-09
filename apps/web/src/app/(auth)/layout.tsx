import Link from 'next/link';

/**
 * Split: formulario a esquerda, painel a direita. Abaixo de lg o painel some
 * -- ele e' respiro, nao conteudo, e em tela estreita viraria scroll morto.
 *
 * O painel da direita mostra o PRODUTO, nao depoimento. Onyx ainda nao tem
 * usuario, e depoimento inventado e' propaganda falsa mesmo em mockup.
 */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ---------------- coluna do formulario ---------------- */}
      <div className="flex flex-col min-h-dvh lg:min-h-0">
        <header className="p-6">
          <Link href="/" className="inline-flex items-center gap-2 group w-fit">
            <span aria-hidden className="size-6 rounded-[5px] bg-accent grid place-items-center">
              <span className="size-2.5 rounded-[1px] bg-accent-ink rotate-45" />
            </span>
            <span className="text-section font-medium tracking-tight group-hover:text-accent transition-colors">
              Onyx
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center px-6 lg:px-0">
          <div className="w-full max-w-[352px] mx-auto">{children}</div>
        </main>

        <footer className="p-6">
          <p className="max-w-[352px] mx-auto text-micro text-ink-subtle leading-relaxed">
            {/* Termos e politica de privacidade ainda nao existem. Link para
                pagina juridica inexistente e' pior que nao ter link. */}
            Ao continuar voce concorda com os termos de uso do Onyx.
          </p>
        </footer>
      </div>

      {/* ---------------- painel ---------------- */}
      <aside className="hidden lg:flex flex-col justify-center border-l border-line px-16 relative overflow-hidden">
        <ShowcasePanel />
      </aside>
    </div>
  );
}

function ShowcasePanel() {
  // Um treino de verdade, renderizado na linguagem visual do produto.
  // Mostra o que a ferramenta faz melhor que qualquer frase de efeito.
  const exercicios = [
    { nome: 'Supino reto', series: '4 × 8', carga: '60 kg' },
    { nome: 'Remada curvada', series: '4 × 10', carga: '45 kg' },
    { nome: 'Desenvolvimento', series: '3 × 12', carga: '22 kg' },
    { nome: 'Rosca direta', series: '3 × 12', carga: '14 kg' },
  ];

  return (
    <div className="relative max-w-[440px]">
      <p className="text-[2rem] leading-[2.5rem] font-medium tracking-tight text-ink">
        O treino que voce monta na segunda,
        <br />
        <span className="text-ink-subtle">na mao do aluno na terca.</span>
      </p>

      <div className="card mt-10 overflow-hidden">
        <div className="flex items-center justify-between px-4 h-11 border-b border-line">
          <span className="label-micro">Treino A · Superior</span>
          <span className="text-micro text-accent">4 exercicios</span>
        </div>
        <ul>
          {exercicios.map((e, i) => (
            <li
              key={e.nome}
              className={`flex items-center justify-between px-4 h-12 ${
                i > 0 ? 'border-t border-line' : ''
              }`}
            >
              <span className="text-body text-ink">{e.nome}</span>
              <span className="flex items-center gap-4">
                <span className="text-body text-ink-muted" data-numeric>
                  {e.series}
                </span>
                <span className="text-body text-ink w-16 text-right" data-numeric>
                  {e.carga}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
