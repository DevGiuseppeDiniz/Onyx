import type { Tables, TablesInsert, Database } from './database.types';
import type { OrgRole } from './roles';

// Aliases de dominio: o resto do codigo importa daqui, nao de database.types.
// Se uma coluna mudar, a migration regenera database.types e o erro aparece
// aqui em um lugar so' -- nao espalhado por cinquenta arquivos.
export type Profile         = Tables<'profiles'>;
export type Organization    = Tables<'organizations'>;
export type Membership      = Tables<'memberships'>;
export type Invite          = Tables<'invites'>;
export type CoachAssignment = Tables<'coach_assignments'>;

export type NewMembership = TablesInsert<'memberships'>;

/**
 * `roles` chega do Postgres como text[] (nao enum, de proposito -- ver a
 * migration de identidade). Este tipo estreita para a UI sem mentir sobre
 * o que o banco garante.
 */
export type MembershipWithRoles = Omit<Membership, 'roles'> & { roles: OrgRole[] };

/** O que a sessao precisa saber: quem sou eu, e em qual entidade, com que papel. */
export type ActiveContext = {
  membershipId: string;
  org: Pick<Organization, 'id' | 'name' | 'slug' | 'kind'>;
  roles: OrgRole[];
};

/** Retorno de public.accept_invite() -- a RPC devolve json, nao tipo composto. */
export type AcceptInviteResult = {
  org_id: string;
  org_name: string;
  org_slug: string;
  org_kind: Database['public']['Enums']['org_kind'];
  membership_id: string;
  roles: string[];
};

/** Retorno de public.create_member(). */
export type CreateMemberResult = {
  membership_id: string;
  invite_code: string;
};
