-- =============================================================================
-- 0003 · RPCs de onboarding
--
-- Por que RPC e nao INSERT direto do cliente: nos tres casos abaixo o usuario
-- AINDA NAO TEM vinculo, logo nenhuma policy pode autoriza-lo. E os tres
-- precisam de atomicidade (org + vinculo de dono; vinculo + atribuicao +
-- convite; resgate + ativacao).
--
-- Cobrem os quatro fluxos:
--   academia          create_organization('Alpha Fit', 'gym',  cnpj, {owner})
--   personal MEI      create_organization('Studio X',  'solo', cnpj, {owner,trainer})
--   entusiasta        create_organization('Meus treinos','solo', null, {owner,trainer,student})
--   aluno convidado   accept_invite('KDX7M2PQ')
-- =============================================================================

-- unaccent e' extensao; esta versao evita a dependencia e resolve
-- os acentos que aparecem em nome de academia brasileira
create or replace function public.unaccent_safe(p_text text)
returns text language sql immutable set search_path = '' as $$
  select translate(
    coalesce(p_text, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  )
$$;

create or replace function app.slugify(p_text text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(
    nullif(
      btrim(
        regexp_replace(
          regexp_replace(lower(public.unaccent_safe(p_text)), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)', '', 'g'
        ),
        '-'
      ),
      ''
    ),
    substr(md5(random()::text), 1, 12)
  )
$$;

-- -----------------------------------------------------------------------------
-- create_organization · cria a entidade E o vinculo do criador na mesma
-- transacao. Sem isso o criador ficaria sem membership e travado fora da
-- propria entidade (o problema classico de bootstrap em multi-tenant).
-- -----------------------------------------------------------------------------
create or replace function public.create_organization(
  p_name  text,
  p_kind  public.org_kind default 'solo',
  p_cnpj  text default null,
  p_roles text[] default array['owner', 'trainer']::text[]
)
returns public.organizations
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_cnpj  text;
  v_slug  text;
  v_org   public.organizations;
  v_roles text[];
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  -- 'owner' e' sempre garantido: quem cria a entidade e' dono dela
  v_roles := (select array_agg(distinct r) from unnest(p_roles || array['owner']::text[]) r);
  if not (v_roles <@ app.valid_roles()) then
    raise exception 'papel invalido em %', v_roles using errcode = '22023';
  end if;

  v_cnpj := nullif(regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g'), '');
  if v_cnpj is not null and char_length(v_cnpj) <> 14 then
    raise exception 'CNPJ deve ter 14 digitos' using errcode = '22023';
  end if;

  -- slug legivel para academia; se colidir, sufixo curto
  v_slug := app.slugify(p_name);
  if exists (select 1 from public.organizations o where o.slug = v_slug) then
    v_slug := left(v_slug, 50) || '-' || substr(md5(random()::text), 1, 6);
  end if;

  insert into public.organizations (name, slug, kind, cnpj, created_by)
  values (btrim(p_name), v_slug, p_kind, v_cnpj, v_uid)
  returning * into v_org;

  insert into public.memberships (org_id, user_id, roles, status, joined_at)
  values (v_org.id, v_uid, v_roles, 'active', now());

  return v_org;
end
$$;

-- -----------------------------------------------------------------------------
-- create_member · o professor cadastra alguem que ainda nao tem conta.
-- Cria o perfil sombra, a atribuicao professor->aluno e o convite de uma vez.
-- -----------------------------------------------------------------------------
create or replace function public.create_member(
  p_org_id       uuid,
  p_display_name text,
  p_roles        text[] default array['student']::text[],
  p_phone        text default null,
  p_email        text default null,
  p_assign_to_me boolean default true
)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_uid        uuid := auth.uid();
  v_me         uuid;
  v_membership uuid;
  v_code       text;
  v_phone      text;
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;
  if not app.is_staff(p_org_id) then
    raise exception 'sem permissao nesta entidade' using errcode = '42501';
  end if;
  if (p_roles && array['owner', 'admin']::text[]) and not app.is_admin(p_org_id) then
    raise exception 'apenas dono/gerente concede papel administrativo' using errcode = '42501';
  end if;
  if not (p_roles <@ app.valid_roles()) then
    raise exception 'papel invalido em %', p_roles using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_display_name, '')), '') is null then
    raise exception 'nome e obrigatorio' using errcode = '22023';
  end if;

  v_me    := app.my_membership_id(p_org_id);
  v_phone := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');

  insert into public.memberships (org_id, roles, status, display_name, phone, email, invited_by)
  values (
    p_org_id, p_roles, 'invited', btrim(p_display_name), v_phone,
    lower(nullif(btrim(coalesce(p_email, '')), '')), v_me
  )
  returning id into v_membership;

  -- se quem cadastrou e' professor e o novo membro e' aluno, ja vincula
  if p_assign_to_me
     and 'student' = any(p_roles)
     and app.has_role(p_org_id, 'trainer')
     and v_me is not null
  then
    insert into public.coach_assignments (org_id, trainer_id, student_id, is_primary)
    values (p_org_id, v_me, v_membership, true)
    on conflict (trainer_id, student_id) do nothing;
  end if;

  v_code := app.gen_invite_code();
  insert into public.invites (org_id, membership_id, code, created_by)
  values (p_org_id, v_membership, v_code, v_uid);

  return json_build_object('membership_id', v_membership, 'invite_code', v_code);
end
$$;

-- -----------------------------------------------------------------------------
-- create_invite · novo codigo para um vinculo ainda nao resgatado
-- (aluno perdeu o codigo, ou o anterior expirou)
-- -----------------------------------------------------------------------------
create or replace function public.create_invite(p_membership_id uuid)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_org  uuid;
  v_user uuid;
  v_code text;
begin
  select m.org_id, m.user_id into v_org, v_user
    from public.memberships m where m.id = p_membership_id;

  if v_org is null then
    raise exception 'vinculo nao encontrado' using errcode = 'P0002';
  end if;
  if not app.is_staff(v_org) then
    raise exception 'sem permissao nesta entidade' using errcode = '42501';
  end if;
  if v_user is not null then
    raise exception 'este vinculo ja tem conta ativa' using errcode = '22023';
  end if;

  -- invalida os codigos abertos anteriores deste vinculo
  delete from public.invites i
   where i.membership_id = p_membership_id and i.accepted_at is null;

  v_code := app.gen_invite_code();
  insert into public.invites (org_id, membership_id, code, created_by)
  values (v_org, p_membership_id, v_code, auth.uid());

  return v_code;
end
$$;

-- -----------------------------------------------------------------------------
-- accept_invite · o aluno digita o codigo no app. Aqui o perfil sombra
-- vira conta de verdade.
-- -----------------------------------------------------------------------------
create or replace function public.accept_invite(p_code text)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_inv record;
  v_org record;
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  select i.id, i.org_id, i.membership_id, i.expires_at, i.accepted_at,
         m.user_id as membership_user_id, m.roles
    into v_inv
    from public.invites i
    join public.memberships m on m.id = i.membership_id
   where i.code = upper(btrim(p_code));

  if v_inv.id is null then
    raise exception 'codigo invalido' using errcode = 'P0002';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'codigo ja utilizado' using errcode = '22023';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'codigo expirado' using errcode = '22023';
  end if;
  if v_inv.membership_user_id is not null then
    raise exception 'este vinculo ja tem conta ativa' using errcode = '22023';
  end if;

  -- TODO(v1.1): se a pessoa JA tem vinculo ativo nesta entidade, hoje
  -- barramos. O caminho certo e' a UI do professor buscar a pessoa antes
  -- de criar perfil sombra; fundir os dois vinculos aqui exigiria decidir
  -- o que fazer com treinos e historico ja atrelados ao sombra.
  if exists (
    select 1 from public.memberships m
     where m.org_id = v_inv.org_id and m.user_id = v_uid
  ) then
    raise exception 'voce ja faz parte desta entidade' using errcode = '22023';
  end if;

  update public.memberships
     set user_id   = v_uid,
         status    = 'active',
         joined_at = now()
   where id = v_inv.membership_id;

  update public.invites set accepted_at = now() where id = v_inv.id;

  select o.id, o.name, o.slug, o.kind into v_org
    from public.organizations o where o.id = v_inv.org_id;

  return json_build_object(
    'org_id',        v_org.id,
    'org_name',      v_org.name,
    'org_slug',      v_org.slug,
    'org_kind',      v_org.kind,
    'membership_id', v_inv.membership_id,
    'roles',         v_inv.roles
  );
end
$$;

-- -----------------------------------------------------------------------------
-- permissoes
-- -----------------------------------------------------------------------------
revoke all on function
  public.create_organization(text, public.org_kind, text, text[]),
  public.create_member(uuid, text, text[], text, text, boolean),
  public.create_invite(uuid),
  public.accept_invite(text)
  from public, anon;

grant execute on function
  public.create_organization(text, public.org_kind, text, text[]),
  public.create_member(uuid, text, text[], text, text, boolean),
  public.create_invite(uuid),
  public.accept_invite(text)
  to authenticated;
