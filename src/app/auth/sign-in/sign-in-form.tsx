"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type UseFormReturn, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type SignInData,
  type SignInInput,
  type SignInResponse,
  signInSchema,
} from "@/lib/validations/sign-in";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";

async function signIn(data: SignInData): Promise<SignInResponse> {
  let response: Response;

  try {
    response = await fetch("/api/v1/sign-in", {
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
        "Não foi possível entrar por um erro no servidor. Tente novamente em alguns instantes.",
    );
  }

  return response.json();
}

type FieldConfig = {
  name: keyof SignInInput;
  label: string;
  type: "email" | "password";
  autoComplete: string;
};

const fields: FieldConfig[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Senha",
    type: "password",
    autoComplete: "current-password",
  },
];

export function SignInForm() {
  const router = useRouter();

  const form = useForm<SignInInput, unknown, SignInData>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      router.push("/");
      // O cabeçalho lê a sessão no servidor: força a releitura.
      router.refresh();
    },
  });

  return (
    <form
      noValidate
      className="w-full max-w-md lg:pt-2"
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
    >
      <FieldGroup className="gap-6">
        {mutation.isError && (
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/5 px-4 py-3"
          >
            <AlertCircleIcon />
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        {fields.map((field) => (
          <FormField key={field.name} field={field} form={form} />
        ))}

        <Button
          type="submit"
          className="h-12 w-full px-8 text-base sm:w-auto sm:self-start"
          disabled={mutation.isPending || mutation.isSuccess}
        >
          {mutation.isPending && <Spinner />}
          {mutation.isPending ? "Entrando…" : "Entrar"}
        </Button>

        <p className="text-[0.9375rem] text-graphite">
          Ainda não tem conta?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-ink underline decoration-ruler decoration-2 underline-offset-4 hover:decoration-promoter focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Criar conta
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}

function FormField({
  field,
  form,
}: {
  field: FieldConfig;
  form: UseFormReturn<SignInInput, unknown, SignInData>;
}) {
  const id = `sign-in-${field.name}`;
  const error = form.formState.errors[field.name];

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
        className="h-11 bg-white px-3 text-base text-foreground md:text-base"
        {...form.register(field.name)}
      />
      {error && <FieldError errors={[error]} />}
    </Field>
  );
}
