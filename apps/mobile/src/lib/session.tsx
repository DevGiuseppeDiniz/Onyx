import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * No app, diferente do web, nao existe middleware renovando o token a cada
 * request. O supabase-js precisa ser avisado quando o app volta do background,
 * senao a sessao expira em segundo plano e o aluno abre o app deslogado no
 * meio do treino.
 */
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

type Ctx = { session: Session | null; carregando: boolean };
const SessionContext = createContext<Ctx>({ session: null, carregando: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSession(nova));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, carregando }}>{children}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
