import { useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { credentialsSchema } from '@onyx/core';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { Field, PasswordField, FormError } from '@/components/ui/field';
import { color, space, type } from '@/theme';
import { traduzirErroAuth } from '@/lib/erros';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();
  const [erroEmail, setErroEmail] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(undefined);
    setErroEmail(undefined);

    const parsed = credentialsSchema.safeParse({ email, password: senha });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErroEmail(f.email?.[0]);
      if (f.password?.[0]) setErro(f.password[0]);
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setCarregando(false);
    // Sem navegacao aqui: o Guarda no _layout observa a sessao e redireciona.
    if (error) setErro(traduzirErroAuth(error.message));
  }

  return (
    <AuthScreen titulo="Entrar" descricao="Acesse sua conta para ver seus treinos.">
      <FormError>{erro}</FormError>

      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        error={erroEmail}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        inputMode="email"
      />

      <PasswordField
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        autoComplete="current-password"
        onSubmitEditing={entrar}
        returnKeyType="go"
      />

      <Button label="Entrar" onPress={entrar} loading={carregando} />

      <View style={s.rodape}>
        <Text style={s.texto}>Recebeu um codigo?</Text>
        <Link href="/convite" style={s.link}>
          Resgatar convite
        </Link>
      </View>
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: space.xs },
  texto: { ...type.body, color: color.inkMuted },
  link: { ...type.body, color: color.accent, fontWeight: '600' },
});
