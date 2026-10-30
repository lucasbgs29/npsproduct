import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError } from "zod";
import type { SignInInput, SignInResponse } from "@/lib/validations/sign-in";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";
import { createSession, type Session } from "@/server/auth/session";
import { createCaller } from "@/server/routers/_app";

function errorResponse(
  status: number,
  error: ApiErrorResponse["error"],
): Response {
  return Response.json({ error } satisfies ApiErrorResponse, { status });
}

function serverError(error: unknown): Response {
  // Erros internos sao logados no servidor, mas nunca expostos ao cliente.
  console.error(error instanceof TRPCError ? (error.cause ?? error) : error);
  return errorResponse(500, {
    code: "INTERNAL_SERVER_ERROR",
    message:
      "Não foi possível entrar por um erro no servidor. Tente novamente em alguns instantes.",
  });
}

// POST /api/v1/sign-in
// Expoe a procedure tRPC `auth.signIn` como endpoint REST (JSON no body)
// e, em caso de sucesso, cria a sessao em cookie.
// O cast so satisfaz o TypeScript: o tRPC valida o body com o schema Zod.
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, {
      code: "BAD_REQUEST",
      message: "O corpo da requisição deve ser um JSON válido.",
    });
  }

  let session: Session;

  try {
    session = await createCaller({ session: null }).auth.signIn(
      body as SignInInput,
    );
  } catch (error) {
    if (
      !(error instanceof TRPCError) ||
      error.code === "INTERNAL_SERVER_ERROR"
    ) {
      return serverError(error);
    }

    if (error.cause instanceof ZodError) {
      return errorResponse(400, {
        code: "BAD_REQUEST",
        message: "Alguns dados estão inválidos. Corrija os campos destacados.",
        issues: error.cause.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return errorResponse(getHTTPStatusCodeFromError(error), {
      code: error.code,
      message: error.message,
    });
  }

  try {
    await createSession(session);
  } catch (error) {
    return serverError(error);
  }

  return Response.json(
    {
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
    } satisfies SignInResponse,
    { status: 200 },
  );
}
