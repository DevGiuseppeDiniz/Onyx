/**
 * Papeis vivem no VINCULO (memberships.roles), nunca na pessoa: o mesmo
 * humano pode ser professor na academia A e aluno na academia B.
 * Toda checagem de permissao no front passa por aqui -- a autoridade real
 * e' o RLS no Postgres, isto e' so' para decidir o que renderizar.
 */
export const ORG_ROLES = ['owner', 'admin', 'trainer', 'student'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_KINDS = ['gym', 'solo'] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const MEMBERSHIP_STATUS = ['invited', 'active', 'inactive'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[number];

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Dono',
  admin: 'Gerente',
  trainer: 'Professor',
  student: 'Aluno',
};

export function hasRole(roles: readonly string[], role: OrgRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: readonly string[], wanted: readonly OrgRole[]): boolean {
  return wanted.some((r) => roles.includes(r));
}

/** Dono ou gerente: manda na entidade inteira. */
export const isAdmin = (roles: readonly string[]) => hasAnyRole(roles, ['owner', 'admin']);

/** Quem opera a entidade -- inclui professor. */
export const isStaff = (roles: readonly string[]) => hasAnyRole(roles, ['owner', 'admin', 'trainer']);

export const canCreateWorkouts = (roles: readonly string[]) => hasRole(roles, 'trainer');
export const canLogWorkouts = (roles: readonly string[]) => hasRole(roles, 'student');
export const canManageMembers = isStaff;
export const canGrantAdminRoles = isAdmin;

/**
 * O entusiasta: dono, professor e aluno de uma entidade de uma pessoa.
 * A UI dele esconde toda nocao de "entidade" -- ele so' ve "meus treinos".
 */
export function isSoloAthlete(kind: OrgKind, roles: readonly string[]): boolean {
  return kind === 'solo' && hasRole(roles, 'trainer') && hasRole(roles, 'student');
}
