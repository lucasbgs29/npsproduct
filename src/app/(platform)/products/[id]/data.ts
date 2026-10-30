import "server-only";

import { TRPCError } from "@trpc/server";
import { cacheTag } from "next/cache";
import type { ProductDetail } from "@/lib/validations/feedbacks";
import { createCaller } from "@/server/routers/_app";

export type ProductResult =
  | { status: "ok"; product: ProductDetail }
  | { status: "not-found" }
  | { status: "error" };

// Dados públicos (produto + avaliações), iguais para qualquer visitante.
// A rota de nova avaliação invalida a tag `product-{id}`; a tag `products`
// (da home) faz um produto recém-cadastrado deixar de dar 404.
// Erros de banco são lançados e por isso nunca ficam no cache.
async function getProductDetail(id: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(`product-${id}`, "products");

  try {
    return await createCaller({ session: null }).feedbacks.productDetail({
      productId: id,
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

export async function loadProduct(id: string): Promise<ProductResult> {
  try {
    const product = await getProductDetail(id);
    return product ? { status: "ok", product } : { status: "not-found" };
  } catch (error) {
    console.error(error instanceof TRPCError ? (error.cause ?? error) : error);
    return { status: "error" };
  }
}
