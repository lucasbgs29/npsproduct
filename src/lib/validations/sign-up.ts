import { z } from "zod";

// Schema compartilhado entre o formulario (cliente) e a API (servidor).
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Informe seu primeiro nome.")
      .max(100, "O primeiro nome deve ter no máximo 100 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(1, "Informe seu sobrenome.")
      .max(100, "O sobrenome deve ter no máximo 100 caracteres."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Informe um email válido, como nome@exemplo.com.")),
    // O bcrypt considera apenas os primeiros 72 bytes da senha.
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .max(72, "A senha pode ter no máximo 72 caracteres.")
      .regex(/[A-Za-z]/, "Inclua pelo menos uma letra na senha.")
      .regex(/\d/, "Inclua pelo menos um número na senha."),
    confirmPassword: z.string().min(1, "Digite a senha novamente."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas são diferentes. Digite a mesma senha nos dois campos.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;

export type SignUpResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};
