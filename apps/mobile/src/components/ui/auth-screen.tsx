import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space, touch, type } from '@/theme';

export function AuthScreen({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={s.flex}
      // Sem isto o teclado cobre o campo e o botao no iOS -- o erro mais comum
      // em formulario de app.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.flex}
        contentContainerStyle={[
          s.conteudo,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={s.voltar}
        >
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <View style={s.cabecalho}>
          <Text style={s.titulo}>{titulo}</Text>
          <Text style={s.descricao}>{descricao}</Text>
        </View>

        <View style={s.corpo}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.canvas },
  conteudo: { paddingHorizontal: space.xl, gap: space.xl },
  voltar: { height: touch.secondary, justifyContent: 'center', alignSelf: 'flex-start' },
  voltarTexto: { ...type.body, color: color.inkMuted },
  cabecalho: { gap: space.sm },
  titulo: { ...type.display, color: color.ink, letterSpacing: -0.6 },
  descricao: { ...type.body, color: color.inkMuted },
  corpo: { gap: space.lg },
});
