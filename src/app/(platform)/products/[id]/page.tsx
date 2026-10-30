import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { io } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  type Feedback,
  type NpsGroup,
  npsGroup,
  type ProductDetail,
} from "@/lib/validations/feedbacks";
import { getSession } from "@/server/auth/session";
import { AiSummary, AiSummarySkeleton } from "./ai-summary";
import { loadProduct } from "./data";
import { FeedbackForm } from "./feedback-form";
import { ScoreDistribution } from "./score-distribution";

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await loadProduct(id);

  if (result.status === "ok") {
    return {
      title: result.product.name,
      description: result.product.description ?? undefined,
    };
  }

  return {
    title: result.status === "not-found" ? "Produto não encontrado" : "Produto",
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const result = await loadProduct(id);

  if (result.status === "not-found") notFound();
  if (result.status === "error") return <LoadError />;

  const { product } = result;

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <ProductHeader product={product} />

      {product.feedbacks.length > 0 && (
        <Suspense fallback={<AiSummarySkeleton />}>
          <AiSummary
            productId={product.id}
            productName={product.name}
            feedbacks={product.feedbacks}
          />
        </Suspense>
      )}

      <ScoreDistribution
        feedbacks={product.feedbacks}
        average={product.score}
      />

      <div className="grid gap-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
        <Suspense
          fallback={<FeedbackListFallback count={product.feedbacks.length} />}
        >
          <FeedbackList feedbacks={product.feedbacks} />
        </Suspense>

        <section
          aria-labelledby="new-feedback-title"
          className="lg:sticky lg:top-8 lg:self-start"
        >
          <h2
            id="new-feedback-title"
            className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
          >
            Sua avaliação
          </h2>
          <div className="mt-6">
            <Suspense
              fallback={
                <p className="flex items-center gap-2 text-graphite">
                  <Spinner /> Carregando…
                </p>
              }
            >
              <FeedbackSlot productId={product.id} />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProductHeader({ product }: { product: ProductDetail }) {
  return (
    <section className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-end md:gap-12">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-white">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`Foto de ${product.name}`}
            fill
            unoptimized
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full items-center justify-center font-display text-[9rem] leading-none font-extrabold text-ruler"
          >
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="max-w-2xl">
        <h1 className="font-display text-5xl leading-[0.92] font-extrabold tracking-tight text-balance text-ink sm:text-7xl">
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-graphite">
            {product.description}
          </p>
        )}
        <a
          href={product.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-sm font-medium text-promoter underline decoration-promoter/40 underline-offset-4 hover:decoration-promoter focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ver na loja
          <ExternalLinkIcon aria-hidden className="size-4" />
          <span className="sr-only">(abre em uma nova aba)</span>
        </a>
      </div>
    </section>
  );
}

const SCORE_TEXT: Record<NpsGroup, string> = {
  detractor: "text-destructive",
  passive: "text-graphite",
  promoter: "text-promoter",
};

function FeedbacksTitle({ count }: { count: number }) {
  return (
    <h2
      id="feedbacks-title"
      className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
    >
      Avaliações <span className="text-graphite tabular-nums">{count}</span>
    </h2>
  );
}

function FeedbackListFallback({ count }: { count: number }) {
  return (
    <section aria-labelledby="feedbacks-title">
      <FeedbacksTitle count={count} />
      <p className="mt-6 flex items-center gap-2 text-graphite">
        <Spinner /> Carregando avaliações…
      </p>
    </section>
  );
}

async function FeedbackList({ feedbacks }: { feedbacks: Feedback[] }) {
  // O "há 2 dias" depende da hora da visita: `io()` tira a lista do
  // prerender (fica atrás do <Suspense>) e o tempo é lido na requisição.
  await io();
  // Um único "agora" para toda a lista.
  const now = Date.now();

  return (
    <section aria-labelledby="feedbacks-title">
      <FeedbacksTitle count={feedbacks.length} />

      {feedbacks.length === 0 ? (
        <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">
          Ninguém avaliou este produto ainda. Seja a primeira pessoa.
        </p>
      ) : (
        <ol className="mt-4">
          {feedbacks.map((feedback) => {
            const createdAt = new Date(feedback.createdAt);

            return (
              <li
                key={feedback.id}
                className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-b border-ruler py-6 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-6"
              >
                <p
                  className={cn(
                    "text-right font-display text-5xl leading-[0.85] font-extrabold tabular-nums sm:text-6xl",
                    SCORE_TEXT[npsGroup(feedback.score)],
                  )}
                >
                  <span className="sr-only">Nota </span>
                  {feedback.score}
                  <span className="sr-only"> de 10</span>
                </p>
                <div className="min-w-0">
                  <p className="leading-relaxed break-words whitespace-pre-line text-ink">
                    {feedback.comment}
                  </p>
                  <p className="mt-3 text-sm text-graphite">
                    <span className="font-medium text-ink">
                      {feedback.author.firstName} {feedback.author.lastName}
                    </span>
                    ,{" "}
                    <time
                      dateTime={feedback.createdAt}
                      title={createdAt.toLocaleString("pt-BR")}
                    >
                      {formatDistance(createdAt, now, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// Lê a sessão (cookie), por isso fica atrás do <Suspense>.
async function FeedbackSlot({ productId }: { productId: string }) {
  const session = await getSession();

  if (!session) return <SignInPrompt />;

  return <FeedbackForm productId={productId} />;
}

function SignInPrompt() {
  return (
    <div className="border-t-4 border-ink pt-6">
      <p className="text-xl font-medium text-ink">
        Entre para avaliar este produto
      </p>
      <p className="mt-2 max-w-sm leading-relaxed text-graphite">
        Qualquer pessoa pode ler as avaliações. Para dar a sua nota de 0 a 10,
        entre na sua conta.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/auth/sign-in"
          className={cn(buttonVariants(), "h-11 px-6 text-base")}
        >
          Entrar
        </Link>
        <Link
          href="/auth/sign-up"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 bg-transparent px-6 text-base",
          )}
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}

function LoadError() {
  return (
    <div role="alert" className="max-w-xl">
      <h1 className="font-display text-5xl leading-[0.92] font-extrabold tracking-tight text-ink sm:text-6xl">
        Não foi possível carregar este produto.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-graphite">
        O servidor não respondeu. Atualize a página em alguns instantes ou volte
        para a lista de produtos.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-8 h-11 px-6 text-base",
        )}
      >
        Ver todos os produtos
      </Link>
    </div>
  );
}
