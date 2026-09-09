import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Next 16 renomeou a convencao `middleware` para `proxy`. Mesma funcao:
// renovar a sessao do Supabase e barrar rota protegida antes de renderizar.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // tudo, menos estatico e imagem -- renovar sessao em request de asset
    // e' desperdicio e atrasa o carregamento
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
