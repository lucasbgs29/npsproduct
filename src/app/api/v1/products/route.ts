import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import type {
  CreateProductInput,
  ListProductsInput,
} from "@/lib/validations/products";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";
import { createCaller } from "@/server/routers/_app";

function errorResponse(
  status: number,
  error: ApiErrorResponse["error"],
): Response {
  return Response.json({ error } satisfies ApiErrorResponse, { status });
}

// Converte erros do tRPC no formato `ApiErrorResponse` (igual ao sign-up).
function handleError(error: unknown, serverErrorMessage: string): Response {
  // Erros internos são logados no servidor, mas nunca expostos ao cliente.
  if (!(error instanceof TRPCError) || error.code === "INTERNAL_SERVER_ERROR") {
    console.error(error instanceof TRPCError ? (error.cause ?? error) : error);
    return errorResponse(500, {
      code: "INTERNAL_SERVER_ERROR",
      message: serverErrorMessage,
    });
  }

  if (error.cause instanceof ZodError) {
    return errorResponse(400, {
      code: "BAD_REQUEST",
      message: "Alguns dados estão inválidos. Corrija os campos indicados.",
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

// GET /api/v1/products?cursor=&limit=
// Lista pública, paginada por cursor: `{ items, nextCursor }`.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input: ListProductsInput = {
    cursor: params.get("cursor") || undefined,
    limit: params.get("limit") || undefined,
  };

  try {
    const page = await createCaller({ session: null }).products.list(input);
    return Response.json(page);
  } catch (error) {
    return handleError(
      error,
      "Os produtos não foram carregados por um erro no servidor. Tente novamente em alguns instantes.",
    );
  }
}

// POST /api/v1/products
// Cadastro público de produtos (sem autenticação).
// Body: `{ name, link, image }`, gravados em `name`, `external_link`, `image_url`.
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
    // O cast só satisfaz o TypeScript: o tRPC valida o body com o schema Zod.
    const product = await createCaller({ session: null }).products.create(
      body as CreateProductInput,
    );
    // A home guarda a primeira página em cache com a tag "products".
    revalidateTag("products", { expire: 0 });
    return Response.json(product, { status: 201 });
  } catch (error) {
    return handleError(
      error,
      "O produto não foi cadastrado por um erro no servidor. Tente novamente em alguns instantes.",
    );
  }
}
