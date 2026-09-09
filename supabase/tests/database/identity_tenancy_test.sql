-- =============================================================================
-- Testes de identidade, multi-tenancy e RLS.
--   pnpm db:test
--
-- O que estes testes protegem: 3 migrations de SQL de seguranca onde um erro
-- nao aparece na UI -- aparece como vazamento de dados entre academias, ou
-- como aluno virando dono. Os 4 fluxos de cadastro estao cobertos aqui.
-- =============================================================================
begin;
select plan(31);

-- -----------------------------------------------------------------------------
-- helpers (locais a transacao: `supabase test db` roda cada arquivo isolado)
-- -----------------------------------------------------------------------------
create schema if not exists tests;
-- os helpers sao chamados JA logado como authenticated (tests.login_as troca
-- de papel), entao o schema precisa de usage para esse papel
grant usage on schema tests to authenticated;

create or replace function tests.mkuser(p_email text)
returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_user_meta_data
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, 'x', now(), now(), now(), json_build_object('full_name', p_email)
  );
  return v_id;
end $$;

create or replace function tests.login_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, true);
end $$;

create or replace function tests.logout()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', null, true);
end $$;

-- -----------------------------------------------------------------------------
-- atores
-- -----------------------------------------------------------------------------
-- As tabelas auxiliares recebem INSERT ja logado como authenticated
-- (tests.login_as troca de papel), e quem as criou foi postgres.
-- Sem grant, o teste falha por permissao antes de testar qualquer coisa.
create temporary table actors (label text primary key, uid uuid);
grant all on actors to authenticated;
insert into actors values
  ('gym_owner',    tests.mkuser('dono@alphafit.test')),
  ('gym_coach',    tests.mkuser('ana@alphafit.test')),
  ('gym_coach2',   tests.mkuser('bruno@alphafit.test')),
  ('gym_student',  tests.mkuser('carlos@alphafit.test')),
  ('rival_owner',  tests.mkuser('dono@rival.test')),
  ('solo_athlete', tests.mkuser('entusiasta@gmail.test'));

create or replace function tests.uid(p_label text)
returns uuid language sql as $$ select uid from actors where label = p_label $$;

create temporary table orgs (label text primary key, id uuid);
grant all on orgs to authenticated;
create temporary table members (label text primary key, id uuid, code text);
grant all on members to authenticated;

-- =============================================================================
-- 1 · o perfil nasce junto com o usuario
-- =============================================================================
select is(
  (select count(*)::int from public.profiles), 6,
  'trigger on_auth_user_created cria um profile por auth.user'
);

-- =============================================================================
-- 2 · ENTUSIASTA: entidade de uma pessoa, owner+trainer+student
-- =============================================================================
select tests.login_as(tests.uid('solo_athlete'));

-- CTE para a funcao ser avaliada UMA vez -- (func()).campo pode reavaliar
with created as (
  select public.create_organization(
    'Meus treinos', 'solo', null, array['owner','trainer','student']::text[]
  ) as o
)
insert into orgs select 'solo', (o).id from created;

select is(
  (select kind::text from public.organizations where id = (select id from orgs where label='solo')),
  'solo', 'entusiasta cria entidade solo'
);
select ok(
  (select roles @> array['owner','trainer','student']::text[]
     from public.memberships where org_id = (select id from orgs where label='solo')),
  'entusiasta acumula os tres papeis no mesmo vinculo'
);
select ok(
  (select status = 'active' and joined_at is not null
     from public.memberships where org_id = (select id from orgs where label='solo')),
  'criador entra ativo -- sem bootstrap travado fora da propria entidade'
);
select is(
  (select count(*)::int from public.memberships), 1,
  'entusiasta se ve sem precisar de coach_assignment nenhum'
);

-- =============================================================================
-- 3 · ACADEMIA: dono cria a entidade e cadastra a equipe
-- =============================================================================
select tests.login_as(tests.uid('gym_owner'));
with created as (
  select public.create_organization(
    'Alpha Fit', 'gym', '11.222.333/0001-81', array['owner']::text[]
  ) as o
)
insert into orgs select 'gym', (o).id from created;

select is(
  (select cnpj from public.organizations where id = (select id from orgs where label='gym')),
  '11222333000181', 'CNPJ e normalizado para 14 digitos sem mascara'
);
select throws_ok(
  $$ select public.create_organization('Bad Inc', 'gym', '123') $$,
  '22023', 'CNPJ deve ter 14 digitos', 'CNPJ malformado e rejeitado'
);

with a as (
  select public.create_member((select id from orgs where label='gym'),
    'Professor Ana', array['trainer']::text[], '11 98888-7777', null, false) as j
)
insert into members select 'coach', (j->>'membership_id')::uuid, j->>'invite_code' from a;

with b as (
  select public.create_member((select id from orgs where label='gym'),
    'Professor Bruno', array['trainer']::text[], null, null, false) as j
)
insert into members select 'coach2', (j->>'membership_id')::uuid, j->>'invite_code' from b;

select is(
  (select phone from public.memberships where id = (select id from members where label='coach')),
  '11988887777', 'telefone e normalizado para digitos'
);
select ok(
  (select code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$'
     from public.invites where membership_id = (select id from members where label='coach')),
  'convite usa alfabeto sem O/0/I/1 -- o codigo e ditado na recepcao'
);
select ok(
  (select user_id is null and status = 'invited'
     from public.memberships where id = (select id from members where label='coach')),
  'perfil sombra existe sem conta: treino e montado antes do app ser instalado'
);

-- ativa os dois professores (fora de RLS, simulando o resgate deles)
select tests.logout();
update public.memberships set user_id = tests.uid('gym_coach'), status = 'active', joined_at = now()
 where id = (select id from members where label='coach');
update public.memberships set user_id = tests.uid('gym_coach2'), status = 'active', joined_at = now()
 where id = (select id from members where label='coach2');

select tests.login_as(tests.uid('gym_coach'));
select throws_ok(
  format($$ select public.create_member(%L, 'Golpe', array['admin']::text[]) $$,
         (select id from orgs where label='gym')),
  '42501', 'apenas dono/gerente concede papel administrativo',
  'professor nao promove ninguem a gerente'
);

with s as (
  select public.create_member((select id from orgs where label='gym'),
    'Aluno Carlos', array['student']::text[], null, null, true) as j
)
insert into members select 'student', (j->>'membership_id')::uuid, j->>'invite_code' from s;

select is(
  (select count(*)::int from public.coach_assignments
    where trainer_id = (select id from members where label='coach')
      and student_id = (select id from members where label='student') and is_primary),
  1, 'aluno cadastrado pelo professor ja vira aluno dele, como principal'
);

-- =============================================================================
-- 4 · ALUNO CONVIDADO: perfil sombra vira conta
-- =============================================================================
select tests.login_as(tests.uid('gym_student'));
select is(
  (public.accept_invite((select code from members where label='student')) ->> 'org_name'),
  'Alpha Fit', 'accept_invite devolve a entidade'
);
select ok(
  (select user_id = tests.uid('gym_student') and status = 'active' and joined_at is not null
     from public.memberships where id = (select id from members where label='student')),
  'resgate liga o vinculo ao usuario e ativa'
);
select throws_ok(
  format($$ select public.accept_invite(%L) $$, (select code from members where label='student')),
  '22023', 'codigo ja utilizado', 'codigo de convite e de uso unico'
);
select throws_ok(
  $$ select public.accept_invite('ZZZZZZZZ') $$,
  'P0002', 'codigo invalido', 'codigo inexistente falha com mensagem clara'
);

-- =============================================================================
-- 5 · ISOLAMENTO
-- =============================================================================
select is(
  (select count(*)::int from public.memberships), 2,
  'aluno ve so o proprio vinculo e o do professor dele'
);
select is(
  (select count(*)::int from public.organizations), 1,
  'aluno ve so a entidade da qual participa'
);

select tests.login_as(tests.uid('gym_coach'));
select is(
  (select count(*)::int from public.memberships), 4,
  'professor ve a equipe e o proprio aluno -- nao a lista inteira de alunos'
);

select tests.login_as(tests.uid('gym_owner'));
select is(
  (select count(*)::int from public.memberships
    where org_id = (select id from orgs where label='gym')),
  4, 'dono ve a entidade inteira'
);

select tests.login_as(tests.uid('rival_owner'));
select is(
  (select count(*)::int from public.memberships), 0,
  'ninguem de fora ve vinculo de outra entidade'
);
select is(
  (select count(*)::int from public.organizations), 0,
  'ninguem de fora ve outra entidade'
);

-- =============================================================================
-- 6 · ESCALACAO DE PRIVILEGIO · o teste que mais importa
-- =============================================================================
select tests.login_as(tests.uid('gym_student'));

-- o aluno TEM update no proprio vinculo (edita telefone).
-- O trigger e que impede esse update de mexer em roles.
select throws_ok(
  format($$ update public.memberships set roles = array['owner']::text[] where id = %L $$,
         (select id from members where label='student')),
  'apenas dono/gerente pode alterar papeis, status ou entidade de um vinculo',
  'aluno NAO se promove a dono alterando o array roles'
);
select lives_ok(
  format($$ update public.memberships set phone = '11999990000' where id = %L $$,
         (select id from members where label='student')),
  'aluno ainda pode editar os proprios dados de contato'
);

-- Aqui NAO ha excecao: o RLS nem deixa o UPDATE alcancar a linha, entao sao
-- zero linhas afetadas, silenciosamente. Assertar throws_ok aqui seria errado.
update public.memberships set status = 'inactive'
 where id = (select id from members where label='coach');
select is(
  (select status::text from public.memberships where id = (select id from members where label='coach')),
  'active', 'RLS impede o aluno de alterar o vinculo do professor (0 linhas afetadas)'
);

-- =============================================================================
-- 7 · INTEGRIDADE
-- =============================================================================
select tests.logout();

select throws_ok(
  format($$ insert into public.coach_assignments (org_id, trainer_id, student_id)
            values (%L, %L, %L) $$,
         (select id from orgs where label='gym'),
         (select id from public.memberships
           where org_id = (select id from orgs where label='solo')),
         (select id from members where label='student')),
  format('professor e aluno precisam pertencer a entidade %s do vinculo',
         (select id from orgs where label='gym')),
  'nao se atribui professor de uma entidade a aluno de outra'
);

select throws_ok(
  format($$ delete from public.memberships
             where org_id = %L and roles @> array['owner']::text[] $$,
         (select id from orgs where label='gym')),
  format('entidade %s ficaria sem dono', (select id from orgs where label='gym')),
  'entidade nunca fica sem dono'
);

-- regressao do bug pego nesta rodada: o cascade de organizations disparava
-- guard_last_owner e abortava a transacao, tornando a exclusao impossivel
select tests.login_as(tests.uid('gym_owner'));
select lives_ok(
  format($$ delete from public.organizations where id = %L $$,
         (select id from orgs where label='gym')),
  'dono exclui a entidade -- cascade nao trava no guard do ultimo dono'
);

-- regressao 0005: o guard era SECURITY DEFINER e barrava postgres/service_role,
-- inviabilizando qualquer script de backend ou atendimento
select tests.logout();
select lives_ok(
  format($$ update public.memberships set roles = array['owner','trainer']::text[]
             where org_id = %L $$, (select id from orgs where label='solo')),
  'service_role/postgres altera papel de vinculo (guard e so para o cliente)'
);

-- regressao 0006: o cascade SET NULL de auth.users caia no raise do guard,
-- tornando impossivel excluir a propria conta
select lives_ok(
  format($$ delete from auth.users where id = %L $$, tests.uid('solo_athlete')),
  'conta com vinculo ativo pode ser excluida (cascade SET NULL passa pelo guard)'
);

-- 0007/0008: nao basta o DELETE passar -- o dado pessoal tem que sair
select ok(
  (select user_id is null
          and display_name = 'Conta excluida'
          and status = 'inactive'
          and email is null
          and phone is null
     from public.memberships where org_id = (select id from orgs where label='solo')),
  'vinculo e anonimizado na exclusao: historico fica, dado pessoal sai'
);

select * from finish();
rollback;
