"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  PRODUCTS_PAGE_SIZE,
  type ProductPage,
} from "@/lib/validations/products";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";
import { ProductListItem } from "./product-list-item";
import {
  ProductListSkeleton,
  ProductListSkeletonRows,
} from "./product-list-skeleton";

const SERVER_ERROR =
  "Os produtos não foram carregados por um erro no servidor. Tente novamente em alguns instantes.";

async function fetchProducts(cursor: string | null): Promise<ProductPage> {
  const params = new URLSearchParams({ limit: String(PRODUCTS_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);

  let response: Response;

  try {
    response = await fetch(`/api/v1/products?${params}`);
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
    );
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    throw new Error(body?.error.message ?? SERVER_ERROR);
  }

  return response.json();
}

type ProductListProps = {
  /** Primeira página vinda do servidor. `null` se a leitura no servidor falhou. */
  initialPage: ProductPage | null;
};

export function ProductList({ initialPage }: ProductListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // `status` não é desestruturado: o TypeScript estreitaria os outros campos
  // pela união de resultados (o erro da próxima página também é "error").
  const query = useInfiniteQuery({
    queryKey: ["products", "list"],
    queryFn: ({ pageParam }) => fetchProducts(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialPage && {
      initialData: { pages: [initialPage], pageParams: [null] },
    }),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = query;

  // Rolagem infinita: busca a próxima página antes de chegar ao fim da lista.
  // Depois de um erro, para de buscar sozinho até a pessoa tentar de novo.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (query.isPending) {
    return <ProductListSkeleton />;
  }

  // Erro sem nenhuma página carregada. Se a falha foi só na próxima página,
  // a lista continua na tela com o aviso no fim.
  if (!data) {
    return (
      <div role="alert" className="border-t border-ruler pt-8">
        <p className="font-display text-3xl font-bold tracking-tight text-ink">
          Não foi possível carregar os produtos.
        </p>
        <p className="mt-2 max-w-prose text-graphite">
          {error?.message ?? SERVER_ERROR}
        </p>
        <Button
          size="lg"
          className="mt-6 px-4"
          disabled={isRefetching}
          onClick={() => refetch()}
        >
          {isRefetching && <Spinner data-icon="inline-start" aria-hidden />}
          Tentar novamente
        </Button>
      </div>
    );
  }

  const products = data.pages.flatMap((page) => page.items);

  if (products.length === 0) {
    return (
      <div className="border-t border-ruler pt-8">
        <p className="font-display text-3xl font-bold tracking-tight text-ink">
          Nenhum produto cadastrado ainda.
        </p>
        <p className="mt-2 max-w-prose text-graphite">
          Os produtos aparecem aqui assim que forem cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="border-t border-ruler" aria-busy={isFetchingNextPage}>
        {products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
        {isFetchingNextPage && <ProductListSkeletonRows rows={2} />}
      </ul>

      <div ref={sentinelRef} className="pt-8" aria-live="polite">
        {isFetchNextPageError ? (
          <div role="alert" className="flex flex-wrap items-center gap-4">
            <p className="text-graphite">
              Não foi possível carregar mais produtos.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="px-4"
              onClick={() => fetchNextPage()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : hasNextPage ? (
          // Alternativa ao carregamento automático (teclado ou navegador sem
          // IntersectionObserver).
          <Button
            variant="outline"
            size="lg"
            className="px-4"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage && (
              <Spinner data-icon="inline-start" aria-hidden />
            )}
            {isFetchingNextPage
              ? "Carregando produtos"
              : "Carregar mais produtos"}
          </Button>
        ) : (
          <p className="text-sm text-graphite">Você viu todos os produtos.</p>
        )}
      </div>
    </div>
  );
}
