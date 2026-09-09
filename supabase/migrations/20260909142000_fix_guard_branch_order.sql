-- =============================================================================
-- 0008 · Ordem dos branches em guard_membership_update
--
-- 0007 colocou a anonimizacao DEPOIS da excecao de papel privilegiado. Como a
-- exclusao de conta e' sempre executada por postgres/supabase_auth_admin, o
-- primeiro branch fazia `return new` e a anonimizacao nunca rodava -- a linha
-- seguia com user_id e display_name nulos e batia no CHECK de novo.
--
-- Principio que estava invertido: a anonimizacao existe para satisfazer um
-- CHECK do schema, que vale para TODOS os papeis. Excecao de papel e' regra de
-- AUTORIZACAO. Logo, a ordem correta e':
--
--   1. cascade de auth.users  -> anonimiza (independe de papel)
--   2. papel privilegiado     -> passa direto
--   3. regras de autorizacao  -> valem para o cliente autenticado
-- =============================================================================
create or replace function app.guard_membership_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- 1. Cascade de auth.users: a conta foi excluida e o SET NULL e'
  -- consequencia. Vem PRIMEIRO porque anonimizar e' o que mantem a linha
  -- valida perante memberships_shadow_has_name, e isso nao depende de papel.
  if old.user_id is not null
     and new.user_id is null
     and not exists (select 1 from auth.users u where u.id = old.user_id)
  then
    new.display_name := coalesce(
      nullif(btrim(coalesce(new.display_name, '')), ''),
      'Conta excluida'
    );
    new.email  := null;
    new.phone  := null;
    new.status := 'inactive';
    return new;
  end if;

  -- 2. service_role e postgres operam fora do RLS por definicao: migration,
  -- script de backend, atendimento.
  if current_user in ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') then
    return new;
  end if;

  -- 3. autorizacao do cliente autenticado, que tem UPDATE no proprio vinculo
  if (new.roles  is distinct from old.roles)
     or (new.status is distinct from old.status)
     or (new.org_id is distinct from old.org_id)
  then
    if not app.is_admin(old.org_id) then
      raise exception 'apenas dono/gerente pode alterar papeis, status ou entidade de um vinculo';
    end if;
  end if;

  if old.user_id is not null and new.user_id is distinct from old.user_id then
    raise exception 'user_id de um vinculo ja resgatado nao pode ser alterado';
  end if;

  return new;
end
$$;
