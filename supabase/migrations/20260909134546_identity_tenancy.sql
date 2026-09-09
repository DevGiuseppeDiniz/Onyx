-- =============================================================================
-- 0001 · Identidade e multi-tenancy
--
-- Modelo central: uma PESSOA (auth.users + profiles) tem N VINCULOS
-- (memberships) com N ENTIDADES (organizations). O papel vive no vinculo,
-- nunca na pessoa -- o mesmo humano pode ser professor na academia A e
-- aluno na academia B.
--
-- memberships.user_id NULL = "perfil sombra": o professor cadastrou o aluno
-- e montou o treino antes do aluno instalar o app. O user_id e' preenchido
-- quando ele resgata o convite.
-- =============================================================================

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- tipos
-- -----------------------------------------------------------------------------
create type public.org_kind          as enum ('gym', 'solo');
create type public.membership_status as enum ('invited', 'active', 'inactive');

-- 'roles' e' text[] e nao enum de proposito: a lista precisa crescer
-- (nutricionista, recepcao, avaliador fisico) sem ALTER TYPE irreversivel.
create or replace function app.valid_roles()
returns text[] language sql immutable set search_path = '' as $$
  select array['owner', 'admin', 'trainer', 'student']::text[]
$$;

create or replace function app.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- -----------------------------------------------------------------------------
-- profiles · 1:1 com auth.users, dados da pessoa (nao do vinculo)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  birth_date  date,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_phone_fmt check (phone is null or phone ~ '^[0-9]{10,15}$')
);

create trigger profiles_touch
  before update on public.profiles
  for each row execute function app.touch_updated_at();

-- perfil nasce junto com o usuario, para nao existir auth.users orfao
create or replace function app.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9]', '', 'g'), '')
  )
  on conflict (id) do nothing;
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- -----------------------------------------------------------------------------
-- organizations · a entidade. kind='gym' academia, kind='solo' personal
-- MEI ou entusiasta treinando sozinho.
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique default substr(md5(random()::text), 1, 12),
  kind        public.org_kind not null default 'solo',
  cnpj        text unique,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint organizations_name_len  check (char_length(btrim(name)) between 2 and 120),
  constraint organizations_slug_fmt  check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  -- CNPJ e' opcional de proposito: MEI recem-aberto ainda nao tem, e travar
  -- o cadastro nisso perde usuario. Guardado sem mascara.
  constraint organizations_cnpj_fmt  check (cnpj is null or cnpj ~ '^[0-9]{14}$')
);

create trigger organizations_touch
  before update on public.organizations
  for each row execute function app.touch_updated_at();

-- -----------------------------------------------------------------------------
-- memberships · o vinculo pessoa <-> entidade, e onde vive o papel
-- -----------------------------------------------------------------------------
create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  roles         text[] not null default array['student']::text[],
  status        public.membership_status not null default 'invited',
  -- dados do perfil sombra: valem enquanto user_id e' null.
  -- depois do resgate, public.profiles passa a ser a fonte da verdade.
  display_name  text,
  email         text,
  phone         text,
  invited_by    uuid references public.memberships(id) on delete set null,
  joined_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- literal e nao app.valid_roles(): funcao dentro de CHECK cria dependencia
  -- fragil no pg_dump/restore. A funcao segue existindo para as RPCs.
  constraint memberships_roles_valid check (
    array_length(roles, 1) >= 1
    and roles <@ array['owner', 'admin', 'trainer', 'student']::text[]
  ),
  -- perfil sombra precisa de nome, senao o professor nao sabe quem e'
  constraint memberships_shadow_has_name check (
    user_id is not null or nullif(btrim(coalesce(display_name, '')), '') is not null
  ),
  constraint memberships_phone_fmt check (phone is null or phone ~ '^[0-9]{10,15}$'),
  constraint memberships_email_fmt check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- uma pessoa tem no maximo um vinculo por entidade (os papeis se acumulam no array)
create unique index memberships_org_user_uniq
  on public.memberships (org_id, user_id) where user_id is not null;
create index memberships_user_idx  on public.memberships (user_id) where user_id is not null;
create index memberships_org_idx   on public.memberships (org_id);
create index memberships_roles_idx on public.memberships using gin (roles);

create trigger memberships_touch
  before update on public.memberships
  for each row execute function app.touch_updated_at();

-- -----------------------------------------------------------------------------
-- invites · codigo curto que transforma perfil sombra em conta de verdade
-- -----------------------------------------------------------------------------
create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  code          text not null unique,
  created_by    uuid references auth.users(id) on delete set null,
  expires_at    timestamptz not null default now() + interval '30 days',
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  -- alfabeto sem O/0/I/1: o codigo e' ditado por telefone na recepcao
  constraint invites_code_fmt check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$')
);

create index invites_membership_idx on public.invites (membership_id);
create index invites_open_idx on public.invites (org_id) where accepted_at is null;

create or replace function app.gen_invite_code()
returns text language plpgsql security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for _i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * char_length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.invites i where i.code = candidate);
  end loop;
  return candidate;
end
$$;

-- -----------------------------------------------------------------------------
-- coach_assignments · aluno <-> professor, N:N DENTRO da entidade.
-- Deliberadamente nao e' uma FK em memberships: professor sai da academia
-- e os alunos continuam existindo; aluno faz musculacao com um e funcional
-- com outro; substituto precisa de acesso temporario.
-- -----------------------------------------------------------------------------
create table public.coach_assignments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  trainer_id  uuid not null references public.memberships(id) on delete cascade,
  student_id  uuid not null references public.memberships(id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (trainer_id, student_id)
);

create index coach_trainer_idx on public.coach_assignments (trainer_id);
create index coach_student_idx on public.coach_assignments (student_id);
-- no maximo um professor principal por aluno
create unique index coach_one_primary_per_student
  on public.coach_assignments (student_id) where is_primary;

-- CHECK nao aceita subquery, entao a coerencia de org/papel vai em trigger
create or replace function app.validate_coach_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t record;
  s record;
begin
  select org_id, roles into t from public.memberships where id = new.trainer_id;
  select org_id, roles into s from public.memberships where id = new.student_id;

  if t.org_id is distinct from new.org_id or s.org_id is distinct from new.org_id then
    raise exception 'professor e aluno precisam pertencer a entidade % do vinculo', new.org_id;
  end if;
  if not ('trainer' = any(t.roles)) then
    raise exception 'membership % nao tem papel trainer', new.trainer_id;
  end if;
  if not ('student' = any(s.roles)) then
    raise exception 'membership % nao tem papel student', new.student_id;
  end if;
  return new;
end
$$;

create trigger coach_assignments_validate
  before insert or update on public.coach_assignments
  for each row execute function app.validate_coach_assignment();
