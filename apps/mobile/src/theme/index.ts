/**
 * Mesmos tokens do painel web (apps/web/src/app/globals.css). O que muda e' a
 * DENSIDADE, nao a paleta: aqui o usuario esta de pe, suado, com uma mao livre
 * e 40 segundos de descanso. Contrato em DESIGN.md.
 */
export const color = {
  canvas: '#0a0a0b',
  surface: '#131316',
  raised: '#1a1a1e',
  overlay: '#212127',

  line: '#26262c',
  edge: '#35353d',

  ink: '#ededee',
  inkMuted: '#8f8f99',
  inkSubtle: '#63636d',

  accent: '#c6f24e',
  accentInk: '#0a0a0b',
  accentDim: '#8fae37',

  danger: '#ff5a5f',
  success: '#4ade80',
  warning: '#fbbf24',
} as const;

/** Escala de 4. Nada fora disso. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  control: 10,
  card: 12,
  pill: 999,
} as const;

/**
 * Quatro papeis, nao uma escala de nove passos. Se voce precisou de um tamanho
 * intermediario, a hierarquia da tela esta errada.
 */
export const type = {
  display: { fontSize: 32, lineHeight: 36, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

/**
 * 56px. O padrao de 44 da Apple pressupoe dedo seco e atencao total; aqui nao
 * ha nem um nem outro. Fora da execucao de treino, 48 e' aceitavel.
 */
export const touch = {
  primary: 56,
  secondary: 48,
} as const;

export const motion = {
  fast: 150,
  base: 250,
} as const;
