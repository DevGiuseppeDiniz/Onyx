'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { MailCheck } from 'lucide-react';
import { signUp, type AuthState } from '../actions';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput, FormError } from '@/components/ui/field';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
      {pending ? 'Criando...' : 'Criar conta'}
    </Button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});

  // Projeto com "Confirm email" ligado nao devolve sessao no signUp. Sem esta
  // tela a pessoa clica em criar conta e aparentemente nada acontece.
  if (state.confirmEmail) {
    return (
      <div className="card p-5 flex flex-col items-start gap-3">
        <span className="icon-tile size-10 text-accent border-accent/30">
          <MailCheck size={18} strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lead font-medium text-ink">Confirme seu e-mail</p>
          <p className="text-body text-ink-muted">
            Enviamos um link para <span className="text-ink">{state.confirmEmail}</span>. Abra
            para ativar a conta e depois volte para entrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field label="Nome completo" htmlFor="fullName" tone="form" error={state.fields?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          size="lg"
          autoComplete="name"
          placeholder="Ana Ribeiro"
          required
          autoFocus
          aria-invalid={Boolean(state.fields?.fullName)}
        />
      </Field>

      <Field label="E-mail" htmlFor="email" tone="form" error={state.fields?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          size="lg"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
          aria-invalid={Boolean(state.fields?.email)}
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        tone="form"
        hint="Minimo de 8 caracteres."
        error={state.fields?.password}
      >
        <PasswordInput
          id="password"
          name="password"
          size="lg"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          aria-invalid={Boolean(state.fields?.password)}
        />
      </Field>

      <Submit />
    </form>
  );
}
