-- =============================================================================
-- 0007 · Exclusao de conta: anonimizar o vinculo em vez de invalida-lo
--
-- Pego pelo teste 30. Corrigir o trigger em 0006 nao bastou: o CHECK
-- `memberships_shadow_has_name` exige display_name quando user_id e' nulo, e
-- vinculos criados por create_organization nunca preenchem display_name (o
-- nome da pessoa vive em profiles). Ao excluir a conta, o cascade SET NULL
-- produzia uma linha sem user_id E sem nome -> violacao de CHECK -> o DELETE
-- em auth.users falhava.
--
-- Decisao de produto, nao so' correcao: ON DELETE CASCADE destruiria o
-- historico de treino que a academia precisa; deixar o nome viola o direito
-- a eliminacao (LGPD art. 18). Anonimizamos: o dado pessoal sai, o historico
-- fica e deixa de identificar ninguem.
--
-- TODO(produto): entidade `solo` cujo unico dono excluiu a conta fica orfa,
-- com treinos e nenhum humano. Provavelmente deve ser purgada -- mas isso e'
-- decisao de retencao, nao de schema, e nao vou tomar sozinho aqui.
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

  -- cascade de auth.users: a conta foi excluida, o SET NULL e' consequencia.
  -- Anonimiza para satisfazer memberships_shadow_has_name e para efetivamente
  -- eliminar o dado pessoal.
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
