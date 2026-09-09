'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setNewPassword, type NovaSenhaState } from './actions';
import { Button } from '@/components/ui/button';
import { Field, PasswordInput, FormError } from '@/components/ui/field';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
      {pending ? 'Salvando...' : 'Salvar senha'}
    </Button>
  );
}

export function NovaSenhaForm() {
  const [state, action] = useActionState<NovaSenhaState, FormData>(setNewPassword, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <>
          <FormError>{state.error}</FormError>
          <Link
            href="/recuperar-senha"
            className="text-body text-ink underline underline-offset-2 hover:text-accent"
          >
            Pedir um novo link
          </Link>
        </>
      )}

      <Field
        label="Nova senha"
        htmlFor="password"
        tone="form"
        hint="Minimo de 8 caracteres."
        error={state.senhaError}
      >
        <PasswordInput
          id="password"
          name="password"
          size="lg"
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus
          aria-invalid={Boolean(state.senhaError)}
        />
      </Field>

      <Field label="Confirme a nova senha" htmlFor="confirm" tone="form">
        <PasswordInput
          id="confirm"
          name="confirm"
          size="lg"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <Submit />
    </form>
  );
}
