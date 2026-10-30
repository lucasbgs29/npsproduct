import { SparklesIcon } from "lucide-react";
import { io } from "next/cache";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Feedback } from "@/lib/validations/feedbacks";
import {
  getProductAiSummary,
  type ProductAiSummary,
} from "@/server/ai/product-summary";

type AiSummaryProps = {
  productId: string;
  productName: string;
  feedbacks: Feedback[];
};

// Pode chamar o modelo (alguns segundos), por isso fica atrás do <Suspense>.
export async function AiSummary({
  productId,
  productName,
  feedbacks,
}: AiSummaryProps) {
  // Nunca roda no prerender/build: o modelo só é chamado numa visita real.
  await io();

  let summary: ProductAiSummary | null;

  try {
    summary = await getProductAiSummary(productId, productName, feedbacks);
  } catch (error) {
    console.error(error);
    return (
      <AiSummaryFrame>
        <p className="text-graphite">
          O resumo não foi gerado agora. As avaliações completas estão logo
          abaixo; tente atualizar a página em alguns instantes.
        </p>
      </AiSummaryFrame>
    );
  }

  if (!summary) return null;

  return (
    <AiSummaryFrame>
      <p className="max-w-[65ch] text-lg leading-relaxed text-ink">
        {summary.text}
      </p>
      <p className="mt-4 text-sm text-graphite">
        Escrito por IA a partir de{" "}
        {summary.feedbackCount === 1
          ? "1 avaliação"
          : `${summary.feedbackCount} avaliações`}
        . Pode conter imprecisões: confira as avaliações abaixo.
      </p>
    </AiSummaryFrame>
  );
}

export function AiSummarySkeleton() {
  return (
    <AiSummaryFrame>
      <p className="flex items-center gap-2 text-graphite">
        <Spinner /> A IA está lendo as avaliações…
      </p>
    </AiSummaryFrame>
  );
}

function AiSummaryFrame({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="ai-summary-title"
      className="rounded-md border border-ruler bg-white p-6 sm:p-8"
    >
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2
          id="ai-summary-title"
          className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
        >
          Resumo das avaliações
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-sm font-medium text-background">
          <SparklesIcon aria-hidden className="size-3.5" />
          Gerado por IA
        </span>
      </div>
      {children}
    </section>
  );
}
