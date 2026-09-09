import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/entrar');

  // Quem tem vinculo vai para o painel; quem nao tem ainda precisa escolher
  // como usa o Onyx.
  const { data } = await supabase.from('memberships').select('id').limit(1);
  redirect(data && data.length > 0 ? '/app' : '/onboarding');
}
