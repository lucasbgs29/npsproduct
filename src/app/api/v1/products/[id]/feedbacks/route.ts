import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import type { CreateFeedbackInput } from "@/lib/validations/feedbacks";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";
import { getSession } from "@/server/auth/session";
import { createCaller } from "@/server/routers/_app";

function errorResponse(
  status: number,
  error: ApiErrorResponse["error"],
): Response {
  return Response.json({ error } satisfies ApiErrorResponse, { status });
}

// POST /api/v1/products/{id}/feedbacks
// Expõe a procedure tRPC `feedbacks.create` como endpoint REST (JSON no body).
// O autor vem da sessão (cookie); qualquer `createdBy` no body é ignorado.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/v1/products/[id]/feedbacks">,
) {
  const { id } = await ctx.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, {
      code: "BAD_REQUEST",
      message: "O corpo da requisição deve ser um JSON válido.",
    });
  }

  const { score, comment } = (body ?? {}) as Partial<CreateFeedbackInput>;

  try {
    const session = await getSession();
    if (!session) {
      return errorResponse(401, {
        code: "UNAUTHORIZED",
        message: "Entre na sua conta para avaliar.",
      });
    }

    // O cast só satisfaz o TypeScript: o tRPC valida a entrada com o schema Zod.
    const feedback = await createCaller({ session }).feedbacks.create({
      productId: id,
      score,
      comment,
    } as CreateFeedbackInput & { productId: string });

    // Sem janela de conteúdo velho: a página do produto mostra a avaliação
    // nova já no próximo acesso. A lista da home só precisa da média nova.
    revalidateTag(`product-${id}`, { expire: 0 });
    revalidateTag("products", "max");

    return Response.json(feedback, { status: 201 });
  } catch (error) {
    // Erros internos são logados no servidor, mas nunca expostos ao cliente.
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
          "A avaliação não foi publicada por um erro no servidor. Tente novamente em alguns instantes.",
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

    if (error.code === "UNAUTHORIZED") {
      return errorResponse(401, {
        code: "UNAUTHORIZED",
        message: "Entre na sua conta para avaliar.",
      });
    }

    return errorResponse(getHTTPStatusCodeFromError(error), {
      code: error.code,
      message: error.message,
    });
  }
}
