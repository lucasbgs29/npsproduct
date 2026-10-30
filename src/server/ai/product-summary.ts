import "server-only";

import type { Feedback } from "@/lib/validations/feedbacks";
import { mastra } from "@/mastra";
import { getSupabaseAdmin } from "@/server/db/supabase";

// Limita o tamanho do prompt: produtos muito avaliados usam as mais recentes.
const MAX_FEEDBACKS = 200;

export type ProductAiSummary = {
  text: string;
  /** Quantas avaliações o modelo leu para escrever o resumo. */
  feedbackCount: number;
};

type SummaryRow = {
  ai_summary: string | null;
  ai_summary_source: string | null;
};

// Identifica o conjunto de avaliações: muda quando entra ou sai uma.
function sourceKey(feedbacks: Feedback[]): string {
  return `${feedbacks.length}:${feedbacks[0]?.id ?? ""}`;
}

function buildPrompt(productName: string, feedbacks: Feedback[]): string {
  const items = feedbacks
    .slice(0, MAX_FEEDBACKS)
    .map(
      (feedback) =>
        // `<` vira `‹` para um comentário não conseguir fechar a tag.
        `<avaliacao nota="${feedback.score}">${feedback.comment.replaceAll("<", "‹")}</avaliacao>`,
    )
    .join("\n");

  return `Produto: ${productName}\n\nAvaliações (${feedbacks.length}):\n${items}`;
}

async function generateSummary(
  productId: string,
  productName: string,
  feedbacks: Feedback[],
  source: string,
): Promise<string> {
  const agent = mastra.getAgentById("feedback-summary-agent");
  const result = await agent.generate(buildPrompt(productName, feedbacks), {
    modelSettings: { temperature: 0.3, maxOutputTokens: 400 },
  });
  const text = result.text.trim();

  if (!text) throw new Error("O agente devolveu um resumo vazio.");

  const { error } = await getSupabaseAdmin()
    .from("products")
    .update({
      ai_summary: text,
      ai_summary_source: source,
      ai_summary_updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  // Falha ao gravar não impede de mostrar o resumo desta visita.
  if (error) console.error(error);

  return text;
}

// Evita duas chamadas ao modelo para o mesmo produto ao mesmo tempo.
const pending = new Map<string, Promise<string>>();

// Devolve o resumo gravado se ele ainda corresponde às avaliações atuais;
// senão pede um novo ao agente e grava. `null` quando não há avaliações.
export async function getProductAiSummary(
  productId: string,
  productName: string,
  feedbacks: Feedback[],
): Promise<ProductAiSummary | null> {
  if (feedbacks.length === 0) return null;

  const source = sourceKey(feedbacks);
  const feedbackCount = Math.min(feedbacks.length, MAX_FEEDBACKS);

  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("ai_summary, ai_summary_source")
    .eq("id", productId)
    .maybeSingle<SummaryRow>();

  if (error) throw error;
  if (data?.ai_summary && data.ai_summary_source === source) {
    return { text: data.ai_summary, feedbackCount };
  }

  const key = `${productId}|${source}`;
  let request = pending.get(key);

  if (!request) {
    request = generateSummary(productId, productName, feedbacks, source);
    pending.set(key, request);
    request.finally(() => pending.delete(key)).catch(() => {});
  }

  return { text: await request, feedbackCount };
}
