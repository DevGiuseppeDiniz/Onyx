-- =============================================================================
-- 0002 · RLS
--
-- A ARMADILHA que essa migration resolve: uma policy em `memberships` precisa
-- consultar `memberships` para saber quem voce e' -> recursao infinita, o
-- Postgres aborta a query. A saida e' concentrar toda a leitura de identidade
-- em funcoes SECURITY DEFINER, que executam como owner e portanto ignoram RLS.
--
-- Regra do projeto: NENHUMA policy consulta uma tabela protegida diretamente.
-- Toda policy chama app.*. Se voce escrever uma policy nova, siga isso.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- helpers de identidade
-- -----------------------------------------------------------------------------
create or replace function app.my_orgs()
returns table (org_id uuid, roles text[])
language sql security definer stable set search_path = '' as $$
  select m.org_id, m.roles
  from public.memberships m
  where m.user_id = auth.uid() and m.status = 'active'
$$;

create or replace function app.has_role(p_org uuid, p_role text)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.org_id  = p_org
      and m.status  = 'active'
      and p_role    = any(m.roles)
  )
$$;

-- dono ou gerente: manda na entidade inteira
create or replace function app.is_admin(p_org uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = p_org and m.status = 'active'
      and m.roles && array['owner', 'admin']::text[]
  )
$$;

-- quem opera a entidade (inclui professor)
create or replace function app.is_staff(p_org uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.org_id = p_org and m.status = 'active'
      and m.roles && array['owner', 'admin', 'trainer']::text[]
  )
$$;

create or replace function app.my_membership_id(p_org uuid)
returns uuid language sql security definer stable set search_path = '' as $$
  select m.id from public.memberships m
  where m.user_id = auth.uid() and m.org_id = p_org and m.status = 'active'
  limit 1
$$;

-- -----------------------------------------------------------------------------
-- FONTE UNICA de visibilidade: quais vinculos eu posso ver.
-- Alterar aqui muda o acesso em todo o sistema -- e' de proposito.
-- -----------------------------------------------------------------------------
create or replace function app.visible_membership_ids()
returns setof uuid
language sql security definer stable set search_path = '' as $$
  with me as (
    select id, org_id, roles
    from public.memberships
    where user_id = auth.uid() and status = 'active'
  )
  -- meus proprios vinculos (cobre o entusiasta, que e' owner+trainer+student
  -- de uma entidade de uma pessoa e nao tem coach_assignment nenhum)
  select id from me
  union
  -- dono/gerente ve a entidade toda
  select m.id
    from public.memberships m
    join me on me.org_id = m.org_id
   where me.roles && array['owner', 'admin']::text[]
  union
  -- professor ve os alunos atribuidos a ele
  select ca.student_id
    from public.coach_assignments ca
    join me on me.id = ca.trainer_id
  union
  -- professor ve a equipe da entidade (nao a lista inteira de alunos)
  select m.id
    from public.memberships m
    join me on me.org_id = m.org_id
   where 'trainer' = any(me.roles)
     and m.roles && array['owner', 'admin', 'trainer']::text[]
  union
  -- aluno ve os professores dele
  select ca.trainer_id
    from public.coach_assignments ca
    join me on me.id = ca.student_id
$$;

create or replace function app.visible_user_ids()
returns setof uuid
language sql security definer stable set search_path = '' as $$
  select auth.uid()
  union
  select m.user_id
    from public.memberships m
   where m.user_id is not null
     and m.id in (select app.visible_membership_ids())
$$;

grant execute on function
  app.my_orgs(), app.has_role(uuid, text), app.is_admin(uuid), app.is_staff(uuid),
  app.my_membership_id(uuid), app.visible_membership_ids(), app.visible_user_ids()
  to authenticated;

-- -----------------------------------------------------------------------------
-- trava de escalacao de privilegio.
-- Sem isso, um aluno com UPDATE no proprio vinculo se promove a owner
-- alterando o array `roles`. RLS nao faz permissao por coluna, entao vai aqui.
-- -----------------------------------------------------------------------------
create or replace function app.guard_membership_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.roles is distinct from old.roles)
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

create trigger memberships_guard_update
  before update on public.memberships
  for each row execute function app.guard_membership_update();

-- entidade nunca fica sem dono
create or replace function app.guard_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  remaining int;
begin
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

create trigger memberships_guard_last_owner
  before delete on public.memberships
  for each row execute function app.guard_last_owner();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.organizations     enable row level security;
alter table public.memberships       enable row level security;
alter table public.invites           enable row level security;
alter table public.coach_assignments enable row level security;

-- nada aqui e' publico
revoke all on public.profiles, public.organizations, public.memberships,
              public.invites, public.coach_assignments from anon;

-- ---------- profiles ----------
create policy profiles_select on public.profiles for select to authenticated
  using (id in (select app.visible_user_ids()));

create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- organizations ----------
-- INSERT nao tem policy de proposito: criar entidade passa por
-- public.create_organization(), que cria a org e o vinculo de dono
-- na mesma transacao. Sem isso o criador ficaria sem membership e
-- travado fora da propria entidade.
create policy organizations_select on public.organizations for select to authenticated
  using (id in (select org_id from app.my_orgs()));

create policy organizations_update on public.organizations for update to authenticated
  using (app.is_admin(id)) with check (app.is_admin(id));

create policy organizations_delete on public.organizations for delete to authenticated
  using (app.has_role(id, 'owner'));

-- ---------- memberships ----------
create policy memberships_select on public.memberships for select to authenticated
  using (id in (select app.visible_membership_ids()));

-- staff cadastra gente na propria entidade (o perfil sombra nasce aqui).
-- Papel administrativo so' quem e' admin concede.
create policy memberships_insert on public.memberships for insert to authenticated
  with check (
    app.is_staff(org_id)
    and (app.is_admin(org_id) or not (roles && array['owner', 'admin']::text[]))
  );

-- o WITH CHECK permite o self-update; o trigger acima e' que impede
-- que esse self-update mexa em roles/status
create policy memberships_update on public.memberships for update to authenticated
  using (
    id in (select app.visible_membership_ids())
    and (app.is_staff(org_id) or user_id = auth.uid())
  )
  with check (
    id in (select app.visible_membership_ids())
    and (app.is_staff(org_id) or user_id = auth.uid())
  );

create policy memberships_delete on public.memberships for delete to authenticated
  using (app.is_admin(org_id));

-- ---------- invites ----------
-- o convidado NAO le esta tabela: ele recebe o codigo por fora (WhatsApp,
-- recepcao) e resgata via public.accept_invite().
create policy invites_select on public.invites for select to authenticated
  using (app.is_staff(org_id));

create policy invites_delete on public.invites for delete to authenticated
  using (app.is_staff(org_id));

-- ---------- coach_assignments ----------
create policy coach_select on public.coach_assignments for select to authenticated
  using (
    trainer_id in (select app.visible_membership_ids())
    or student_id in (select app.visible_membership_ids())
  );

create policy coach_insert on public.coach_assignments for insert to authenticated
  with check (
    app.is_admin(org_id)
    or trainer_id = app.my_membership_id(org_id)
  );

create policy coach_update on public.coach_assignments for update to authenticated
  using (app.is_admin(org_id) or trainer_id = app.my_membership_id(org_id))
  with check (app.is_admin(org_id) or trainer_id = app.my_membership_id(org_id));

create policy coach_delete on public.coach_assignments for delete to authenticated
  using (app.is_admin(org_id) or trainer_id = app.my_membership_id(org_id));
