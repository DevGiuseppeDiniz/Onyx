'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestPasswordReset, type RecoverState } from './actions';
import { Button } from '@/components/ui/button';
import { Field, Input, FormError } from '@/components/ui/field';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
      {pending ? 'Enviando...' : 'Enviar link'}
    </Button>
  );
}

export function RecoverForm() {
  const [state, action] = useActionState<RecoverState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <div className="card p-5">
        <p className="text-body text-ink">
          Se existir conta para <span className="text-accent">{state.sent}</span>, o link chega em
          instantes.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>
      <Field label="E-mail" htmlFor="email" tone="form" error={state.emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          size="lg"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
          autoFocus
          aria-invalid={Boolean(state.emailError)}
        />
      </Field>
      <Submit />
    </form>
  );
}
