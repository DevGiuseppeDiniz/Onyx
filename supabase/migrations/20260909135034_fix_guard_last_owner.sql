-- =============================================================================
-- 0004 · Corrige guard_last_owner: excluir uma entidade era impossivel
--
-- O trigger `memberships_guard_last_owner` protege contra remover o ultimo
-- dono de uma entidade. Mas ele tambem dispara no DELETE em cascata que vem
-- de `organizations` -- e ai o raise aborta a transacao inteira. Resultado:
-- a policy `organizations_delete` existia mas nunca conseguia executar.
--
-- Pego pelos testes de RLS antes de qualquer tela ser escrita.
-- =============================================================================
create or replace function app.guard_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  remaining int;
begin
  -- Se a entidade nao existe mais, este DELETE e' o cascade da FK: a org
  -- inteira esta sendo removida e nao ha dono a proteger. O parent ja saiu
  -- da visao da transacao quando o cascade roda, entao este teste e' seguro.
  if not exists (select 1 from public.organizations o where o.id = old.org_id) then
    return old;
  end if;

  if not (old.roles && array['owner']::text[]) then
    return old;
  end if;

  select count(*) into remaining
    from public.memberships m
   where m.org_id = old.org_id
     and m.id <> old.id
     and m.status = 'active'
     and m.roles && array['owner']::text[];

  if remaining = 0 then
    raise exception 'entidade % ficaria sem dono', old.org_id;
  end if;

  return old;
end
$$;
