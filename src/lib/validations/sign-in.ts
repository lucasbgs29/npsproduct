import { z } from "zod";

// Schema compartilhado entre o formulario (cliente) e a API (servidor).
// A senha nao repete as regras de forca do sign-up: no login isso so
// serviria para revelar a politica de senha.
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um email válido, como nome@exemplo.com.")),
  password: z.string().min(1, "Digite sua senha."),
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;

export type SignInResponse = {
  firstName: string;
  lastName: string;
  email: string;
};
