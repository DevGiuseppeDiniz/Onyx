// URL/URLSearchParams nao existem no Hermes; o supabase-js depende deles.
// Precisa vir antes de qualquer import do cliente.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@onyx/core';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No app nao existe redirect com token na URL -- isso e' coisa de web,
      // e deixar ligado faz o cliente tentar ler window.location.
      detectSessionInUrl: false,
    },
  },
);
