'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dumbbell, UserRound, Building2, Check } from 'lucide-react';
import { completeOnboarding, type OnboardingState } from './actions';
import { Button } from '@/components/ui/button';
import { Field, Input, FormError } from '@/components/ui/field';
import { cn } from '@/lib/cn';

type Intent = 'solo_athlete' | 'trainer' | 'gym';

const OPCOES: Array<{
  intent: Intent;
  icon: typeof Dumbbell;
  titulo: string;
  descricao: string;
}> = [
  {
    intent: 'solo_athlete',
    icon: Dumbbell,
    titulo: 'Treino por conta propria',
    descricao: 'Monte ou escolha treinos e registre suas series.',
  },
  {
    intent: 'trainer',
    icon: UserRound,
    titulo: 'Sou personal ou professor',
    descricao: 'Monte treinos e acompanhe seus proprios alunos.',
  },
  {
    intent: 'gym',
    icon: Building2,
    titulo: 'Represento uma academia',
    descricao: 'Cadastre professores e centralize os alunos da unidade.',
  },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? 'Criando...' : 'Continuar'}
    </Button>
  );
}

export function OnboardingForm() {
  const [state, action] = useActionState<OnboardingState, FormData>(completeOnboarding, {});
  const [intent, setIntent] = useState<Intent>('solo_athlete');

  // O entusiasta nao nomeia nada: a entidade dele e' criada em silencio.
  // Ele nunca ve a palavra "entidade" -- multi-tenancy invisivel para quem
  // nao precisa dela.
  const precisaNome = intent !== 'solo_athlete';

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="intent" value={intent} />
      <FormError>{state.error}</FormError>

      <div role="radiogroup" aria-label="Como voce usa o Onyx" className="flex flex-col gap-2">
        {OPCOES.map(({ intent: value, icon: Icon, titulo, descricao }) => {
          const ativo = intent === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => setIntent(value)}
              className={cn(
                'group flex items-start gap-3 rounded-[var(--radius-card)] border p-3 text-left',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1',
                ativo
                  ? 'border-accent/50 bg-accent/5'
                  : 'border-line bg-surface hover:border-edge hover:bg-raised',
              )}
            >
              <span
                className={cn(
                  'grid place-items-center size-9 rounded-[var(--radius-control)] border shrink-0',
                  ativo ? 'border-accent/40 text-accent' : 'border-line text-ink-subtle',
                )}
              >
                <Icon size={16} strokeWidth={1.5} />
              </span>

              <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-lead font-medium text-ink">{titulo}</span>
                <span className="text-body text-ink-muted">{descricao}</span>
              </span>

              {/* Marca de selecao ocupa espaco sempre, mesmo invisivel: sem
                  isso o card inteiro reflui ao trocar de opcao. */}
              <span
                className={cn(
                  'grid place-items-center size-4 rounded-full border shrink-0 mt-0.5',
                  ativo ? 'border-accent bg-accent text-accent-ink' : 'border-edge',
                )}
              >
                {ativo && <Check size={10} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {precisaNome && (
        <div className="flex flex-col gap-4 pt-1">
          <Field
            label={intent === 'gym' ? 'Nome da academia' : 'Nome do seu trabalho'}
            htmlFor="orgName"
            hint={
              intent === 'gym'
                ? undefined
                : 'Aparece para seus alunos. Pode ser seu proprio nome.'
            }
            error={state.fields?.orgName}
          >
            <Input
              id="orgName"
              name="orgName"
              required
              placeholder={intent === 'gym' ? 'Alpha Fit' : 'Studio Ana Ribeiro'}
              aria-invalid={Boolean(state.fields?.orgName)}
            />
          </Field>

          <Field
            label="CNPJ"
            htmlFor="cnpj"
            hint="Opcional. MEI recem-aberto ainda nao tem, e isso nao trava nada."
            error={state.fields?.cnpj}
          >
            <Input
              id="cnpj"
              name="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              aria-invalid={Boolean(state.fields?.cnpj)}
            />
          </Field>

          {intent === 'gym' && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="alsoTeaches"
                className="size-3.5 rounded-[3px] border-line bg-raised accent-accent"
              />
              <span className="text-body text-ink-muted">
                Eu tambem dou aula e quero montar treinos
              </span>
            </label>
          )}
        </div>
      )}

      <Submit />
    </form>
  );
}
