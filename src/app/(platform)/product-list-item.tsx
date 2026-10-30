import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/validations/products";

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// No NPS, quem dá 9 ou 10 é "promotor" (mesma regra da régua do cadastro).
const PROMOTER_FROM = 9;

const scoreFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Linha da lista: imagem, nome, descrição e a nota média sobre uma régua 0–10.
// Mesma grade do skeleton (`product-list-skeleton.tsx`), para não pular ao carregar.
export const productRowGrid =
  "grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-ruler py-6 sm:grid-cols-[10rem_minmax(0,1fr)_8.5rem] sm:gap-x-8 sm:py-8";

export function ProductListItem({ product }: { product: Product }) {
  const href = `/products/${product.id}`;

  return (
    <li className={productRowGrid}>
      {/* A imagem repete o link do nome só para mouse/toque (área maior). */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-4/3 overflow-hidden rounded-sm bg-muted sm:row-span-2"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 640px) 10rem, 5.5rem"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-ruler select-none">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <h2 className="font-display text-2xl leading-[1.05] font-bold tracking-tight text-ink sm:text-3xl">
          <Link
            href={href}
            className="rounded-xs underline-offset-4 decoration-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {product.name}
          </Link>
        </h2>
        {product.description && (
          <p className="mt-2 line-clamp-2 max-w-prose leading-relaxed text-graphite">
            {product.description}
          </p>
        )}
      </div>

      <ProductScore score={product.score} />
    </li>
  );
}

function ProductScore({ score }: { score: number | null }) {
  const rounded = score === null ? -1 : Math.round(score);
  const label =
    score === null
      ? "Ainda sem avaliações"
      : `Nota média ${scoreFormat.format(score)} de 10`;

  return (
    <div className="col-start-2 flex items-center gap-4 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col-reverse sm:items-end sm:justify-end sm:gap-2">
      <span className="sr-only">{label}</span>

      {/* Régua de 11 traços: preenchida até a nota média arredondada. */}
      <span aria-hidden className="flex h-4 items-end gap-[3px]">
        {SCALE.map((n) => (
          <span
            key={n}
            className={cn(
              "w-[3px] rounded-[1px] bg-ruler",
              n % 5 === 0 ? "h-4" : "h-2.5",
              n <= rounded && (n >= PROMOTER_FROM ? "bg-promoter" : "bg-ink"),
            )}
          />
        ))}
      </span>

      {score === null ? (
        <span aria-hidden className="text-sm text-graphite sm:mb-2">
          Sem avaliações
        </span>
      ) : (
        <span
          aria-hidden
          className={cn(
            "font-display text-3xl leading-[0.85] font-extrabold tabular-nums sm:text-6xl",
            score >= PROMOTER_FROM ? "text-promoter" : "text-ink",
          )}
        >
          {scoreFormat.format(score)}
        </span>
      )}
    </div>
  );
}
