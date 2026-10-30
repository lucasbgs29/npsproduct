import "server-only";

import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { signInSchema } from "@/lib/validations/sign-in";
import { type SignUpResponse, signUpSchema } from "@/lib/validations/sign-up";
import type { Session } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { publicProcedure, router } from "@/server/trpc";

// Custo do bcrypt: 10 mantem o hash abaixo de ~100ms com bcryptjs (JS puro).
const BCRYPT_COST = 10;

// Codigo do Postgres para violacao de restricao unique.
const UNIQUE_VIOLATION = "23505";

// Hash bcrypt (custo 10) de uma senha que ninguem usa. Quando o email nao
// existe, comparamos contra ele para o tempo de resposta nao revelar
// quais emails tem conta.
const DUMMY_PASSWORD_HASH =
  "$2b$10$xyzEbH6PS9D/0DAtyz.wQ.zBxTdtEj5Uv6J2WDUEA7c/cRRuCK0X2";

// Mesma mensagem para email inexistente, senha errada ou conta inativa.
const INVALID_CREDENTIALS = "Email ou senha inválidos.";

export const authRouter = router({
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }): Promise<SignUpResponse> => {
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

      const { data, error } = await getSupabaseAdmin()
        .from("accounts")
        .insert({
          id: nanoid(),
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          password: passwordHash,
        })
        .select("id, first_name, last_name, email, created_at")
        .single();

      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já tem uma conta. Use outro email.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar a conta.",
          cause: error,
        });
      }

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        createdAt: data.created_at,
      };
    }),

  // Retorna os dados da conta (sem o hash). A rota REST cria a sessao.
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }): Promise<Session> => {
      const { data, error } = await getSupabaseAdmin()
        .from("accounts")
        .select("id, first_name, last_name, email, password, active")
        .eq("email", input.email)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível entrar.",
          cause: error,
        });
      }

      const passwordMatches = await bcrypt.compare(
        input.password,
        data?.password ?? DUMMY_PASSWORD_HASH,
      );

      if (!data || !passwordMatches || !data.active) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: INVALID_CREDENTIALS,
        });
      }

      return {
        accountId: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
      };
    }),
});
