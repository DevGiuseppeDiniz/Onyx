import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { color, space, type } from '@/theme';

/**
 * Entrada do app. A ordem dos botoes nao e' cosmetica: o app e' do ALUNO, e o
 * aluno chega aqui com um codigo na mao que o professor deu. Quem cria conta
 * do zero e' minoria -- o entusiasta. Por isso "Tenho um codigo" e' o primario.
 */
export default function Entrada() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.tela, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
      <View style={s.topo}>
        <Logo size={36} />
      </View>

      <View style={s.meio}>
        <Text style={s.titulo}>Seu treino,{'\n'}na palma da mao.</Text>
        <Text style={s.sub}>
          Veja a rotina que seu professor montou e registre cada serie enquanto treina.
        </Text>
      </View>

      <View style={s.acoes}>
        <Link href="/convite" asChild>
          <Button label="Tenho um codigo de convite" />
        </Link>
        <Link href="/criar-conta" asChild>
          <Button label="Treino por conta propria" variant="secondary" />
        </Link>

        <View style={s.rodape}>
          <Text style={s.rodapeTexto}>Ja tem conta?</Text>
          <Link href="/entrar" style={s.rodapeLink}>
            Entrar
          </Link>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: color.canvas, paddingHorizontal: space.xl },
  topo: { alignItems: 'flex-start' },
  meio: { flex: 1, justifyContent: 'center', gap: space.md },
  titulo: { ...type.display, color: color.ink, letterSpacing: -0.8 },
  sub: { ...type.body, color: color.inkMuted, maxWidth: 300 },
  acoes: { gap: space.md },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, paddingTop: space.md },
  rodapeTexto: { ...type.body, color: color.inkMuted },
  rodapeLink: { ...type.body, color: color.accent, fontWeight: '600' },
});
