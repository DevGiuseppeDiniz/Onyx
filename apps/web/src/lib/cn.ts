/** Junta classes ignorando falsy. Suficiente aqui -- nao precisamos de
 *  merge de conflito do Tailwind porque as variantes sao fechadas. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
