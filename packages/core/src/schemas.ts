import { z } from 'zod';
import { ORG_ROLES, ORG_KINDS } from './roles';

const onlyDigits = (v: string) => v.replace(/\D/g, '');

export const phoneSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length >= 10 && v.length <= 15, 'Telefone invalido');

/** CNPJ guardado sem mascara. Valida os dois digitos verificadores. */
export const cnpjSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 14, 'CNPJ deve ter 14 digitos')
  .refine((v) => !/^(\d)\1{13}$/.test(v), 'CNPJ invalido')
  .refine(isValidCnpj, 'CNPJ invalido');

export function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14) return false;
  const check = (len: number) => {
    let sum = 0;
    let weight = len - 7;
    for (let i = 0; i < len; i++) {
      sum += Number(digits[i]) * weight;
      weight = weight - 1 < 2 ? 9 : weight - 1;
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
}

/** Alfabeto sem O/0/I/1: o codigo e' ditado por telefone ou na recepcao. */
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 8;

export const inviteCodeSchema = z
  .string()
  .transform((v) => v.trim().toUpperCase().replace(/[\s-]/g, ''))
  .refine(
    (v) => new RegExp(`^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`).test(v),
    'Codigo de convite invalido',
  );

export const emailSchema = z.string().trim().toLowerCase().email('E-mail invalido');
export const passwordSchema = z.string().min(8, 'Minimo de 8 caracteres');
export const fullNameSchema = z.string().trim().min(2, 'Informe o nome').max(120);

// ---------------------------------------------------------------------------
// os quatro fluxos de entrada
// ---------------------------------------------------------------------------

/** Aluno de academia ou de personal: resgata o codigo que recebeu. */
export const acceptInviteSchema = z.object({
  code: inviteCodeSchema,
});

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = credentialsSchema.extend({
  fullName: fullNameSchema,
  phone: phoneSchema.optional(),
});

/** Entusiasta: entidade de uma pessoa, ele e' dono, professor e aluno. */
export const soloAthleteOnboardingSchema = z.object({
  intent: z.literal('solo_athlete'),
  orgName: z.string().trim().min(2).max(120).default('Meus treinos'),
});

/** Personal MEI: entidade solo, CNPJ opcional -- MEI novo ainda nao tem. */
export const trainerOnboardingSchema = z.object({
  intent: z.literal('trainer'),
  orgName: z.string().trim().min(2).max(120),
  cnpj: cnpjSchema.optional(),
});

/** Academia: entidade gym, o criador e' dono e pode nao dar aula. */
export const gymOnboardingSchema = z.object({
  intent: z.literal('gym'),
  orgName: z.string().trim().min(2).max(120),
  cnpj: cnpjSchema.optional(),
  alsoTeaches: z.boolean().default(false),
});

export const onboardingSchema = z.discriminatedUnion('intent', [
  soloAthleteOnboardingSchema,
  trainerOnboardingSchema,
  gymOnboardingSchema,
]);

export type Onboarding = z.infer<typeof onboardingSchema>;

/** Traduz a escolha do onboarding nos argumentos de create_organization(). */
export function onboardingToCreateOrgArgs(input: Onboarding): {
  p_name: string;
  p_kind: (typeof ORG_KINDS)[number];
  p_cnpj: string | null;
  p_roles: (typeof ORG_ROLES)[number][];
} {
  switch (input.intent) {
    case 'solo_athlete':
      return { p_name: input.orgName, p_kind: 'solo', p_cnpj: null, p_roles: ['owner', 'trainer', 'student'] };
    case 'trainer':
      return { p_name: input.orgName, p_kind: 'solo', p_cnpj: input.cnpj ?? null, p_roles: ['owner', 'trainer'] };
    case 'gym':
      return {
        p_name: input.orgName,
        p_kind: 'gym',
        p_cnpj: input.cnpj ?? null,
        p_roles: input.alsoTeaches ? ['owner', 'trainer'] : ['owner'],
      };
  }
}

/** Professor cadastrando aluno que ainda nao instalou o app (perfil sombra). */
export const createMemberSchema = z.object({
  orgId: z.string().uuid(),
  displayName: fullNameSchema,
  roles: z.array(z.enum(ORG_ROLES)).min(1).default(['student']),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  assignToMe: z.boolean().default(true),
});
