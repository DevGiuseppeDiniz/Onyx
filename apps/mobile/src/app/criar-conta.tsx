import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { signUpSchema, onboardingToCreateOrgArgs } from '@onyx/core';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { Field, PasswordField, FormError } from '@/components/ui/field';
import { color, radius, space, type } from '@/theme';
import { traduzirErroAuth } from '@/lib/erros';

export default function CriarConta() {
  // Vem de /convite quando a pessoa digitou o codigo sem ter conta ainda.
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [campos, setCampos] = useState<Record<string, string | undefined>>({});
  const [erro, setErro] = useState<string>();
  const [confirmar, setConfirmar] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function criar() {
    setErro(undefined);
    setCampos({});

    const parsed = signUpSchema.safeParse({ fullName: nome, email, password: senha });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setCampos({ nome: f.fullName?.[0], email: f.email?.[0], senha: f.password?.[0] });
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.fullName } },
    });

    if (error) {
      setCarregando(false);
      setErro(traduzirErroAuth(error.message));
      return;
    }

    // Com "Confirm email" ligado nao vem sessao; nao da para seguir.
    if (!data.session) {
      setCarregando(false);
      setConfirmar(parsed.data.email);
      return;
    }

    if (codigo) {
      // Veio pelo convite: resgata na sequencia, sem pedir o codigo de novo.
      const { error: erroConvite } = await supabase.rpc('accept_invite', { p_code: codigo });
      if (erroConvite) setErro(erroConvite.message);
    } else {
      // Entusiasta: entidade de uma pessoa, criada em silencio. Ele nunca ve
      // a palavra "entidade".
      const args = onboardingToCreateOrgArgs({ intent: 'solo_athlete', orgName: 'Meus treinos' });
      const { error: erroOrg } = await supabase.rpc('create_organization', {
        p_name: args.p_name,
        p_kind: args.p_kind,
        p_roles: args.p_roles,
      });
      if (erroOrg) setErro('Conta criada, mas houve um erro ao configurar. Entre novamente.');
    }

    setCarregando(false);
    // O Guarda no _layout redireciona ao detectar a sessao.
  }

  if (confirmar) {
    return (
      <AuthScreen titulo="Confirme seu e-mail" descricao="Falta um passo para ativar sua conta.">
        <View style={s.aviso}>
          <Text style={s.avisoTexto}>
            Enviamos um link para <Text style={s.destaque}>{confirmar}</Text>. Abra o link e
            depois volte para entrar.
          </Text>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      titulo="Criar conta"
      descricao={
        codigo
          ? `Depois de criar, seu convite ${codigo} e resgatado automaticamente.`
          : 'Monte seus proprios treinos e registre suas series.'
      }
    >
      <FormError>{erro}</FormError>

      <Field
        label="Nome completo"
        value={nome}
        onChangeText={setNome}
        error={campos.nome}
        placeholder="Ana Ribeiro"
        autoComplete="name"
      />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        error={campos.email}
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
        error={campos.senha}
        hint="Minimo de 8 caracteres."
        placeholder="••••••••"
        autoComplete="new-password"
        onSubmitEditing={criar}
        returnKeyType="go"
      />

      <Button label="Criar conta" onPress={criar} loading={carregando} />
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  aviso: {
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    padding: space.lg,
  },
  avisoTexto: { ...type.body, color: color.inkMuted },
  destaque: { color: color.accent },
});
