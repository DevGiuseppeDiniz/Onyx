# Onyx

App de treino. **Professor** monta treino na web, **aluno** executa e registra
no celular. Multi-tenant desde o primeiro commit.

## Os quatro fluxos de entrada

O modelo de dados atende os quatro sem caso especial -- todos sao a mesma
entidade + vinculo, mudando so' os papeis:

| Quem | `org.kind` | `roles` |
|---|---|---|
| Academia (dono) | `gym` | `{owner}` ou `{owner,trainer}` |
| Professor contratado | `gym` | `{trainer}` |
| Aluno da academia | `gym` | `{student}` |
| Personal MEI | `solo` | `{owner,trainer}` |
| **Entusiasta** (treina sozinho) | `solo` | `{owner,trainer,student}` |

O papel vive no **vinculo**, nunca na pessoa: o mesmo humano pode ser
professor na academia A e aluno na academia B.

## Estrutura

```
apps/web        Next.js 16 · painel do professor (entrada de dados densa)
apps/mobile     Expo SDK 57 · app do aluno (execucao de treino)
packages/core   tipos, schemas Zod e regra de negocio -- compartilhado
supabase/       migrations, RLS e testes pgTAP
DESIGN.md       contrato visual · toda tela nova cita ele
```

`packages/core` compartilha **tipos, schemas e logica**. Nao compartilha UI:
um botao que funciona em React Native e em HTML custa uma semana e sai feio
nos dois lados.

## Rodando

```bash
pnpm install
pnpm db:start      # sobe Postgres, Auth e Studio local  (precisa de Docker)
pnpm db:reset      # aplica as migrations do zero
pnpm db:test       # testes pgTAP de RLS e multi-tenancy
pnpm db:types      # gera packages/core/src/database.types.ts
pnpm web           # http://localhost:3000
pnpm mobile        # Expo Dev Client
```

Copie `.env.example` para `.env` e preencha com o que `pnpm db:start` imprime.

## Decisoes que nao se desfazem barato

- **Papel no vinculo, nao na pessoa.** Sem isso multi-tenancy quebra na raiz.
- **Aluno pertence a entidade, nao ao professor.** Professor sai da academia
  e os alunos continuam; aluno treina com mais de um professor.
- **Perfil sombra** (`memberships.user_id` nulo). O professor cadastra o aluno
  e monta o treino antes do aluno instalar o app. Sem isso, o professor fica
  esperando o aluno baixar o app e o produto morre no primeiro dia.
- **Toda policy chama `app.*`, nunca consulta tabela protegida direto.**
  Policy em `memberships` que le `memberships` = recursao infinita. As funcoes
  `SECURITY DEFINER` em `supabase/migrations/*_rls_policies.sql` existem
  exatamente para isso.
- **Onboarding via RPC, nao INSERT.** Quem cria uma entidade ainda nao tem
  vinculo, logo nenhuma policy pode autoriza-lo. `create_organization()`
  cria org + vinculo de dono na mesma transacao.
- **CNPJ opcional.** MEI recem-aberto nao tem, e travar o cadastro nisso
  perde usuario.

## Backup

O plano Free do Supabase **nao inclui backup nenhum**. Enquanto estiver no
Free, `.github/workflows/db-backup.yml` E' o backup -- configure o secret
`SUPABASE_DB_URL`. Perder os treinos de um professor perde o cliente.
