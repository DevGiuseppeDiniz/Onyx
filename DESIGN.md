# Onyx · sistema visual

Este arquivo e' contrato, nao inspiracao. Toda tela nova cita ele.
Se um valor nao esta aqui, ele nao existe no produto.

## Principio

Dark-first, um acento so'. App usado em ambiente escuro, com uma mao,
suado, sem oculos. Cada decisao abaixo vem dessa frase.

## Cor

Onyx e' pedra preta. O fundo e' quase preto, nunca preto puro (#000 mata
a percepcao de profundidade e cansa em OLED).

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0A0A0B` | fundo da tela |
| `surface` | `#141416` | card, lista |
| `surface-raised` | `#1C1C20` | modal, bottom sheet, input |
| `border` | `#2A2A30` | divisor, contorno de input |
| `text` | `#F4F4F5` | conteudo principal |
| `text-muted` | `#A1A1AA` | rotulo, metadado |
| `text-subtle` | `#71717A` | placeholder, desabilitado |
| `accent` | `#C6F24E` | acao primaria, progresso, foco |
| `accent-fg` | `#0A0A0B` | texto sobre o acento |
| `danger` | `#FF5A5F` | destrutivo, erro |
| `success` | `#4ADE80` | serie concluida |
| `warning` | `#FBBF24` | carga acima do planejado |

**Uma cor de acento.** Verde-lima sobre neutros. O resto e' cinza. E' o que
separa app bonito de app com arco-iris de gradiente. Nada de segundo acento
"so' para essa tela".

Semantica (`danger`/`success`/`warning`) nunca carrega informacao sozinha --
sempre acompanhada de icone ou texto, por conta de daltonismo.

## Tipografia

Quatro papeis, nao uma escala de nove passos. Se voce precisou de um
tamanho intermediario, a hierarquia da tela esta errada.

| Papel | Tamanho / linha | Peso | Uso |
|---|---|---|---|
| `display` | 32 / 36 | 700 | carga, reps, cronometro |
| `title` | 20 / 28 | 600 | nome do treino, cabecalho |
| `body` | 15 / 22 | 400 | conteudo, nome de exercicio |
| `caption` | 13 / 18 | 500 | rotulo, unidade, metadado |

**Numero sempre em `font-variant-numeric: tabular-nums`.** Sem isso a carga
"88 kg" pula de largura para "90 kg" e a lista tremula durante a serie.

## Espaco

Escala de 4: `4 8 12 16 24 32 48`. Nada fora disso.
Respiro padrao de tela: `16` nas laterais.

## Toque

**Minimo de 56px de altura** em qualquer alvo da tela de execucao de treino.
O padrao de 44px da Apple pressupoe dedo seco e atencao total; aqui nao tem
nem um nem outro. Fora da execucao, 44px e' aceitavel.

Botao primario: altura 56, raio 12, `accent` com `accent-fg`.

## Movimento

Serve de feedback, nunca de decoracao.

- Transicao de estado: 150ms, `ease-out`
- Entrada de sheet/modal: 250ms, spring suave
- Serie concluida: um pulso curto no `success` + haptico
- Nada acima de 300ms. Nada que se repita em loop.

Respeitar `prefers-reduced-motion` / `Reduce Motion` do sistema.

## Input de treino: a regra que mais importa

O aluno registra durante a serie, com a mao tremendo e 40 segundos de
descanso. Cada campo obedece:

1. **Valor pre-preenchido** com o da ultima sessao. O caso comum e' repetir.
2. **Stepper, nao teclado.** `-` e `+` com incremento inteligente
   (2,5 kg em barra livre; 5 kg em maquina; 1 rep).
3. **Teclado numerico** so' como escape, e ja com o valor selecionado.
4. **Zero confirmacao.** Salvar e' automatico, com desfazer.

Se um input de treino precisa de mais de um toque para o caso comum,
ele esta errado.

## Densidade

Tela de execucao: um exercicio por vez, ocupando a tela.
Tela de planejamento (web, professor): densa, tabela, atalho de teclado.
As duas usam os mesmos tokens e escalas -- o que muda e' a densidade.
