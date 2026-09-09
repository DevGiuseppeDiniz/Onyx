import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, radius, space, touch, type } from '@/theme';

export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocado(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={color.inkSubtle}
        style={[s.input, focado && s.inputFocado, Boolean(error) && s.inputErro, props.style]}
      />
      {/* Erro SUBSTITUI a dica: campo que cresce ao errar empurra o formulario
          e desorienta -- pior ainda em tela pequena. */}
      {error ? (
        <Text style={s.erro}>{error}</Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Campo de senha com botao de revelar. */
export function PasswordField(props: TextInputProps & { label: string; hint?: string; error?: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <View>
      <Field {...props} secureTextEntry={!visivel} autoCapitalize="none" autoCorrect={false} />
      <Pressable
        onPress={() => setVisivel((v) => !v)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        style={s.revelar}
      >
        <Text style={s.revelarTexto}>{visivel ? 'Ocultar' : 'Mostrar'}</Text>
      </Pressable>
    </View>
  );
}

export function FormError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <View style={s.alerta} accessibilityRole="alert">
      <Text style={s.alertaTexto}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.caption, color: color.inkMuted },
  input: {
    height: touch.secondary,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.raised,
    paddingHorizontal: space.lg,
    color: color.ink,
    ...type.body,
  },
  inputFocado: { borderColor: color.accent },
  inputErro: { borderColor: color.danger },
  hint: { ...type.caption, color: color.inkSubtle },
  erro: { ...type.caption, color: color.danger },

  // Alinhado ao input, que fica abaixo do label de 18px + gap de 8
  revelar: { position: 'absolute', right: space.md, top: 18 + space.sm + 14 },
  revelarTexto: { ...type.caption, color: color.inkMuted },

  alerta: {
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: 'rgba(255,90,95,0.35)',
    backgroundColor: 'rgba(255,90,95,0.08)',
    padding: space.md,
  },
  alertaTexto: { ...type.body, color: color.danger },
});
