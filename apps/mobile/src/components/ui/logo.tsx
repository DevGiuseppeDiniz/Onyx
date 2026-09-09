import { StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '@/theme';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View style={s.wrap}>
      <View style={[s.marca, { width: size, height: size, borderRadius: size / 4 }]}>
        <View style={[s.pedra, { width: size * 0.4, height: size * 0.4 }]} />
      </View>
      <Text style={s.nome}>Onyx</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  marca: { backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  pedra: { backgroundColor: color.accentInk, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  nome: { ...type.title, color: color.ink, letterSpacing: -0.4 },
});
