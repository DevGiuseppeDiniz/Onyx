'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, type AuthState } from '../actions';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput, FormError } from '@/components/ui/field';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
      {pending ? 'Entrando...' : 'Entrar'}
    </Button>
  );
}

export function SignInForm({ proximo }: { proximo?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      {proximo && <input type="hidden" name="proximo" value={proximo} />}
      <FormError>{state.error}</FormError>

      <Field label="E-mail" htmlFor="email" tone="form" error={state.fields?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          size="lg"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
          autoFocus
          aria-invalid={Boolean(state.fields?.email)}
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        tone="form"
        error={state.fields?.password}
        action={
          <Link
            href="/recuperar-senha"
            className="text-body text-ink-muted hover:text-ink underline underline-offset-2"
          >
            Esqueceu a senha?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          size="lg"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-invalid={Boolean(state.fields?.password)}
        />
      </Field>

      <Submit />
    </form>
  );
}
