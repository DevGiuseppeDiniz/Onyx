import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROLE_LABELS, type OrgRole } from '@onyx/core';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/session';
import { Logo } from '@/components/ui/logo';
import { color, radius, space, touch, type } from '@/theme';

type Contexto = { nome: string; entidade: string; papeis: OrgRole[] };

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [ctx, setCtx] = useState<Contexto | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const [{ data: perfil }, { data: vinculo }] = await Promise.all([
        supabase.from('profiles').select('full_name').maybeSingle(),
        supabase
          .from('memberships')
          .select('roles, organizations(name)')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle(),
      ]);
      if (!ativo) return;
      setCtx({
        nome: perfil?.full_name ?? session?.user.email ?? '',
        entidade: vinculo?.organizations?.name ?? '',
        papeis: (vinculo?.roles ?? []) as OrgRole[],
      });
    })();
    return () => {
      ativo = false;
    };
  }, [session]);

  const primeiroNome = ctx?.nome.split(' ')[0] ?? '';

  return (
    <ScrollView
      style={s.tela}
      contentContainerStyle={[
        s.conteudo,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <View style={s.topo}>
        <Logo size={28} />
        <Pressable
          onPress={() => supabase.auth.signOut()}
          hitSlop={12}
          accessibilityRole="button"
          style={s.sair}
        >
          <Text style={s.sairTexto}>Sair</Text>
        </Pressable>
      </View>

      <View style={s.saudacao}>
        <Text style={s.ola}>Ola{primeiroNome ? `, ${primeiroNome}` : ''}</Text>
        {ctx?.entidade ? (
          <Text style={s.meta}>
            {ctx.entidade} · {ctx.papeis.map((p) => ROLE_LABELS[p]).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* Estado vazio com borda tracejada, mesmo padrao do painel web. */}
      <View style={s.vazio}>
        <Text style={s.vazioTitulo}>Nenhum treino atribuido</Text>
        <Text style={s.vazioTexto}>
          Quando seu professor montar sua rotina, ela aparece aqui. A tela de execucao entra na
          proxima etapa.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: color.canvas },
  conteudo: { paddingHorizontal: space.xl, gap: space.xl },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sair: { height: touch.secondary, justifyContent: 'center' },
  sairTexto: { ...type.body, color: color.inkMuted },
  saudacao: { gap: space.xs },
  ola: { ...type.display, color: color.ink, letterSpacing: -0.6 },
  meta: { ...type.body, color: color.inkMuted },
  vazio: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.sm,
    alignItems: 'center',
  },
  vazioTitulo: { ...type.body, fontWeight: '600', color: color.ink },
  vazioTexto: { ...type.caption, color: color.inkMuted, textAlign: 'center' },
});
