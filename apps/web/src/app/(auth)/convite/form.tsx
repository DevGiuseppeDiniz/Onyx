'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { redeemInvite, type InviteState } from './actions';
import { Button } from '@/components/ui/button';
import { Field, Input, FormError } from '@/components/ui/field';
import { INVITE_CODE_LENGTH } from '@onyx/core';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
      {pending ? 'Resgatando...' : 'Resgatar'}
    </Button>
  );
}

export function RedeemForm() {
  const [state, action] = useActionState<InviteState, FormData>(redeemInvite, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field
        label="Codigo de convite"
        htmlFor="code"
        tone="form"
        hint="Sem os caracteres O, 0, I e 1 -- eles nao existem no codigo."
        error={state.codeError}
      >
        <Input
          id="code"
          name="code"
          size="lg"
          required
          autoFocus
          autoCapitalize="characters"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={INVITE_CODE_LENGTH + 2}
          placeholder="KDX7M2PQ"
          // Fonte mono e espacamento largo: codigo ditado por telefone precisa
          // ser conferido caractere a caractere.
          className="font-mono tracking-[0.35em] uppercase text-center"
          aria-invalid={Boolean(state.codeError)}
        />
      </Field>

      <Submit />
    </form>
  );
}
