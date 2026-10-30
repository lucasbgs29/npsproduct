"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type ApiErrorResponse,
  type SignUpData,
  type SignUpInput,
  type SignUpResponse,
  signUpSchema,
} from "@/lib/validations/sign-up";
import { NpsRuler } from "../nps-ruler";

async function signUp(data: SignUpData): Promise<SignUpResponse> {
  let response: Response;

  try {
    response = await fetch("/api/v1/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
    );
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    throw new Error(
      body?.error.message ??
        "A conta não foi criada por um erro no servidor. Tente novamente em alguns instantes.",
    );
  }

  return response.json();
}

type FieldConfig = {
  name: keyof SignUpInput;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  description?: string;
};

const nameFields: FieldConfig[] = [
  {
    name: "firstName",
    label: "Primeiro nome",
    type: "text",
    autoComplete: "given-name",
  },
  {
    name: "lastName",
    label: "Sobrenome",
    type: "text",
    autoComplete: "family-name",
  },
];

const emailField: FieldConfig = {
  name: "email",
  label: "Email",
  type: "email",
  autoComplete: "email",
};

const passwordFields: FieldConfig[] = [
  {
    name: "password",
    label: "Senha",
    type: "password",
    autoComplete: "new-password",
    description: "Pelo menos 8 caracteres, com letras e números.",
  },
  {
    name: "confirmPassword",
    label: "Confirmar senha",
    type: "password",
    autoComplete: "new-password",
  },
];

// Cada um dos 5 campos válidos avança 2 pontos na régua (0 → 10).
function useProgress(form: UseFormReturn<SignUpInput, unknown, SignUpData>) {
  const values = useWatch({ control: form.control });
  const { shape } = signUpSchema;

  const valid = [
    shape.firstName.safeParse(values.firstName).success,
    shape.lastName.safeParse(values.lastName).success,
    shape.email.safeParse(values.email).success,
    shape.password.safeParse(values.password).success,
    !!values.confirmPassword && values.confirmPassword === values.password,
  ];

  return valid.filter(Boolean).length * 2;
}

type SignUpFormProps = {
  intro: React.ReactNode;
};

export function SignUpForm({ intro }: SignUpFormProps) {
  const router = useRouter();

  const form = useForm<SignUpInput, unknown, SignUpData>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const progress = useProgress(form);

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => router.push("/auth/sign-up/success"),
  });

  const renderField = (field: FieldConfig) => (
    <FormField key={field.name} field={field} form={form} />
  );

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <NpsRuler
        value={progress}
        label={
          progress === 10
            ? "Cadastro completo: 10 de 10"
            : `Seu cadastro: ${progress} de 10`
        }
      />

      <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="max-w-md">{intro}</div>

        <form
          noValidate
          className="max-w-xl"
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        >
          <FieldGroup className="gap-6">
            {mutation.isError && (
              <Alert
                variant="destructive"
                className="border-destructive/40 bg-destructive/5 px-4 py-3"
              >
                <AlertCircleIcon />
                <AlertTitle>Sua conta não foi criada</AlertTitle>
                <AlertDescription>{mutation.error.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {nameFields.map(renderField)}
            </div>

            {renderField(emailField)}

            <div className="grid gap-6 sm:grid-cols-2">
              {passwordFields.map(renderField)}
            </div>

            <Button
              type="submit"
              className="h-12 w-full px-8 text-base sm:w-auto sm:self-start"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Spinner />}
              {mutation.isPending ? "Criando conta…" : "Criar conta"}
            </Button>

            <p className="text-[0.9375rem] text-graphite">
              Já tem conta?{" "}
              <Link
                href="/auth/sign-in"
                className="font-medium text-ink underline decoration-ruler decoration-2 underline-offset-4 hover:decoration-promoter focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Entrar
              </Link>
            </p>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

function FormField({
  field,
  form,
}: {
  field: FieldConfig;
  form: UseFormReturn<SignUpInput, unknown, SignUpData>;
}) {
  const id = `sign-up-${field.name}`;
  const error = form.formState.errors[field.name];
  const descriptionId = field.description ? `${id}-description` : undefined;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id} className="text-[0.9375rem]">
        {field.label}
      </FieldLabel>
      <Input
        id={id}
        type={field.type}
        autoComplete={field.autoComplete}
        aria-invalid={!!error}
        aria-describedby={descriptionId}
        className="h-11 bg-white px-3 text-base text-foreground md:text-base"
        {...form.register(field.name)}
      />
      {error ? (
        <FieldError errors={[error]} />
      ) : (
        field.description && (
          <FieldDescription id={descriptionId}>
            {field.description}
          </FieldDescription>
        )
      )}
    </Field>
  );
}
