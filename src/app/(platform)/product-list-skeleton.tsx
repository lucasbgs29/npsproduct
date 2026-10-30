import { productRowGrid } from "./product-list-item";

const block = "rounded-sm bg-muted animate-pulse motion-reduce:animate-none";

// Linhas "vazias" com a mesma grade e altura dos itens reais.
export function ProductListSkeletonRows({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: linhas estáticas, sem estado.
    <li key={i} aria-hidden className={productRowGrid}>
      <div className={`${block} aspect-4/3 sm:row-span-2`} />
      <div>
        <div className={`${block} h-7 w-2/3 sm:h-8`} />
        <div className={`${block} mt-3 h-4 w-full max-w-prose`} />
        <div className={`${block} mt-2 h-4 w-4/5 max-w-prose`} />
      </div>
      <div className="col-start-2 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex sm:justify-end">
        <div className={`${block} h-4 w-[60px]`} />
      </div>
    </li>
  ));
}

export function ProductListSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Carregando produtos</p>
      <ul className="border-t border-ruler">
        <ProductListSkeletonRows rows={4} />
      </ul>
    </div>
  );
}
