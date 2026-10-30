import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError } from "zod";
import type { ApiErrorResponse, SignUpInput } from "@/lib/validations/sign-up";
import { createCaller } from "@/server/routers/_app";

function errorResponse(
  status: number,
  error: ApiErrorResponse["error"],
): Response {
  return Response.json({ error } satisfies ApiErrorResponse, { status });
}

// POST /api/v1/sign-up
// Expoe a procedure tRPC `auth.signUp` como endpoint REST (JSON no body).
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

  try {
    const account = await createCaller({ session: null }).auth.signUp(
      body as SignUpInput,
    );
    return Response.json(account, { status: 201 });
  } catch (error) {
    // Erros internos sao logados no servidor, mas nunca expostos ao cliente.
    if (
      !(error instanceof TRPCError) ||
      error.code === "INTERNAL_SERVER_ERROR"
    ) {
      console.error(
        error instanceof TRPCError ? (error.cause ?? error) : error,
      );
      return errorResponse(500, {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "A conta não foi criada por um erro no servidor. Tente novamente em alguns instantes.",
      });
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
}
