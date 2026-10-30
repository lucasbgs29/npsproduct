import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  PRODUCTS_PAGE_SIZE,
  type ProductPage,
} from "@/lib/validations/products";
import { createCaller } from "@/server/routers/_app";
import { ProductList } from "./product-list";
import { ProductListSkeleton } from "./product-list-skeleton";

export const metadata: Metadata = {
  title: "Produtos",
};

// Primeira página da lista, igual para todo mundo: fica em cache por alguns
// minutos e é invalidada (tag "products") quando um produto é cadastrado.
// Erros não entram no cache: a próxima visita tenta de novo.
async function getFirstProductsPage(): Promise<ProductPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  return createCaller({ session: null }).products.list({
    limit: PRODUCTS_PAGE_SIZE,
  });
}

async function FirstProductsPage() {
  // Lê o banco na requisição (não no build): sem isso, uma falha no build
  // ficaria gravada na página estática.
  await connection();

  let initialPage: ProductPage | null = null;

  try {
    initialPage = await getFirstProductsPage();
  } catch (error) {
    // A lista no cliente tenta de novo e mostra o erro com "Tentar novamente".
    console.error(error);
  }

  return <ProductList initialPage={initialPage} />;
}

export default function HomePage() {
  return (
    <>
      <div className="mb-10 max-w-2xl sm:mb-14">
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-7xl">
          Produtos avaliados por quem usa.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-graphite">
          Cada produto mostra a nota média que recebeu, de zero a dez. Abra um
          produto para ler as avaliações ou dar a sua nota.
        </p>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <FirstProductsPage />
      </Suspense>
    </>
  );
}
