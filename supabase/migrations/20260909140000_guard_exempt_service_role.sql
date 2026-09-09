-- =============================================================================
-- 0005 · guard_membership_update tambem barrava postgres e service_role
--
-- O trigger era SECURITY DEFINER. Dentro de uma funcao SECURITY DEFINER o
-- `current_user` e' o DONO da funcao, nao quem chamou, e `auth.uid()` e' nulo
-- fora de uma request do PostgREST. Resultado: `app.is_admin()` retornava
-- false para todo mundo e o raise disparava mesmo para service_role --
-- nenhum script de backend, migration ou suporte conseguia ativar um vinculo
-- ou corrigir um papel.
--
-- Correcao: a funcao passa a ser SECURITY INVOKER (nao precisava de DEFINER --
-- quem le identidade e' app.is_admin, essa sim DEFINER), e o papel efetivo
-- ganha excecao explicita.
--
-- Nota de escopo: guard_last_owner segue valendo para TODOS os papeis.
-- Aquilo e' invariante de dominio ("entidade nao fica sem dono"), nao regra
-- de autorizacao -- service_role tambem nao deve poder violar.
-- =============================================================================
create or replace function app.guard_membership_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- service_role e postgres operam fora do RLS por definicao: migration,
  -- script de backend, atendimento. A trava aqui e' contra o cliente
  -- autenticado que tem UPDATE no proprio vinculo.
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if (new.roles  is distinct from old.roles)
     or (new.status is distinct from old.status)
     or (new.org_id is distinct from old.org_id)
  then
    if not app.is_admin(old.org_id) then
      raise exception 'apenas dono/gerente pode alterar papeis, status ou entidade de um vinculo';
    end if;
  end if;

  -- user_id so' pode sair de null (resgate de convite), nunca ser trocado
  if old.user_id is not null and new.user_id is distinct from old.user_id then
    raise exception 'user_id de um vinculo ja resgatado nao pode ser alterado';
  end if;

  return new;
end
$$;
