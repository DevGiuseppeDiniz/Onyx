import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { inviteCodeSchema, INVITE_CODE_LENGTH } from '@onyx/core';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/session';
import { AuthScreen } from '@/components/ui/auth-screen';
import { Button } from '@/components/ui/button';
import { Field, FormError } from '@/components/ui/field';
import { color, space, type } from '@/theme';

export default function Convite() {
  const { session } = useSession();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string>();
  const [erroCodigo, setErroCodigo] = useState<string>();
  const [carregando, setCarregando] = useState(false);

  async function resgatar() {
    setErro(undefined);
    setErroCodigo(undefined);

    const parsed = inviteCodeSchema.safeParse(codigo);
    if (!parsed.success) {
      setErroCodigo(parsed.error.issues[0]?.message);
      return;
    }

    // accept_invite exige sessao: o vinculo precisa saber a QUEM ligar. Quem
    // ainda nao tem conta cria primeiro, com o codigo preservado na rota.
    if (!session) {
      router.push({ pathname: '/criar-conta', params: { codigo: parsed.data } });
      return;
    }

    setCarregando(true);
    const { error } = await supabase.rpc('accept_invite', { p_code: parsed.data });
    setCarregando(false);

    // A RPC ja devolve mensagem voltada ao usuario final.
    if (error) setErroCodigo(error.message);
    else router.replace('/inicio');
  }

  return (
    <AuthScreen
      titulo="Resgatar convite"
      descricao="Digite o codigo que voce recebeu da academia ou do seu professor."
    >
      <FormError>{erro}</FormError>

      <Field
        label="Codigo de convite"
        value={codigo}
        onChangeText={(t) => setCodigo(t.toUpperCase())}
        error={erroCodigo}
        hint="Nao existem os caracteres O, 0, I e 1 no codigo."
        placeholder="KDX7M2PQ"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="one-time-code"
        maxLength={INVITE_CODE_LENGTH + 2}
        onSubmitEditing={resgatar}
        returnKeyType="go"
        // Mono e espacado: codigo ditado na recepcao precisa ser conferido
        // caractere a caractere.
        style={s.codigo}
      />

      <Button label="Resgatar" onPress={resgatar} loading={carregando} />
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  codigo: {
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    ...type.title,
    color: color.ink,
    height: 56,
    paddingHorizontal: space.md,
  },
});
