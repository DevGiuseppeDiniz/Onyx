import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { color, radius, space, touch, type } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const inativo = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: loading }}
      // Sem animacao de escala: em tela de execucao o dedo ja esta impreciso,
      // e alvo que encolhe ao toque aumenta erro.
      style={({ pressed }) => [
        s.base,
        s[variant],
        pressed && !inativo && s[`${variant}Pressed`],
        inativo && s.inativo,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? color.accentInk : color.ink} />
      ) : (
        <View style={s.conteudo}>
          {icon}
          <Text style={[s.label, variant === 'primary' ? s.labelPrimary : s.labelDefault]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    height: touch.primary,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderWidth: 1,
  },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { ...type.body, fontWeight: '600' },
  labelPrimary: { color: color.accentInk },
  labelDefault: { color: color.ink },

  primary: { backgroundColor: color.accent, borderColor: color.accent },
  primaryPressed: { backgroundColor: color.accentDim, borderColor: color.accentDim },

  secondary: { backgroundColor: color.raised, borderColor: color.line },
  secondaryPressed: { backgroundColor: color.overlay, borderColor: color.edge },

  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  ghostPressed: { backgroundColor: color.raised },

  inativo: { opacity: 0.45 },
});
