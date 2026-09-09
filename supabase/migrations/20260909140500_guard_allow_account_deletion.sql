-- =============================================================================
-- 0006 · guard_membership_update impedia excluir uma conta
--
-- `memberships.user_id references auth.users(id) on delete set null`. Quando
-- a conta e' excluida, o cascade emite um UPDATE que zera user_id -- e cai
-- exatamente no raise de "user_id de um vinculo ja resgatado nao pode ser
-- alterado". Efeito: DELETE em auth.users falha, e o usuario nunca consegue
-- apagar a propria conta (LGPD, direito a eliminacao).
--
-- Mesma familia do bug de 0004 (cascade de organizations). A correcao aqui e'
-- estrutural em vez de por papel: se a conta referenciada nao existe mais,
-- este UPDATE E' o cascade, e nao ha o que proteger. Vale para qualquer papel,
-- inclusive supabase_auth_admin, que e' quem o GoTrue usa para excluir conta.
-- =============================================================================
create or replace function app.guard_membership_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- service_role e postgres operam fora do RLS por definicao: migration,
  -- script de backend, atendimento. A trava e' contra o cliente autenticado,
  -- que tem UPDATE no proprio vinculo.
  if current_user in ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin') then
    return new;
  end if;

  -- cascade de auth.users: a conta foi excluida, o SET NULL e' consequencia
  if old.user_id is not null
     and new.user_id is null
     and not exists (select 1 from auth.users u where u.id = old.user_id)
  then
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

  if old.user_id is not null and new.user_id is distinct from old.user_id then
    raise exception 'user_id de um vinculo ja resgatado nao pode ser alterado';
  end if;

  return new;
end
$$;
