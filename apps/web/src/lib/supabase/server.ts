import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@onyx/core';

/**
 * Cliente de servidor. Sempre revalida a sessao contra o Auth -- nunca
 * confie em `getSession()` no servidor, o cookie e' manipulavel pelo cliente.
 * Use `supabase.auth.getUser()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component nao pode escrever cookie. O middleware e' quem
            // renova a sessao; aqui o catch e' esperado, nao erro.
          }
        },
      },
    },
  );
}
