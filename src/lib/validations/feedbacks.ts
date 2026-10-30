import { z } from "zod";
import type { Product } from "@/lib/validations/products";

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;
export const COMMENT_MAX = 2000;

const SCORE_MESSAGE = "Escolha uma nota de 0 a 10.";

// Schema compartilhado entre o formulário (cliente) e a API (servidor).
export const createFeedbackSchema = z.object({
  score: z
    .int(SCORE_MESSAGE)
    .min(SCORE_MIN, SCORE_MESSAGE)
    .max(SCORE_MAX, SCORE_MESSAGE),
  comment: z
    .string("Escreva um comentário sobre o produto.")
    .trim()
    .min(1, "Escreva um comentário sobre o produto.")
    .max(
      COMMENT_MAX,
      `O comentário pode ter no máximo ${COMMENT_MAX} caracteres.`,
    ),
});

export type CreateFeedbackInput = z.input<typeof createFeedbackSchema>;
export type CreateFeedbackData = z.output<typeof createFeedbackSchema>;

// Entrada da procedure tRPC: o produto vem da URL, o autor vem da sessão.
export const createFeedbackProcedureSchema = createFeedbackSchema.extend({
  productId: z.string().trim().min(1).max(64),
});

export const productDetailSchema = z.object({
  productId: z.string().trim().min(1).max(64),
});

export type Feedback = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  // Só o nome público: o email de quem avaliou nunca sai do servidor.
  author: { firstName: string; lastName: string };
};

export type ProductDetail = Product & { feedbacks: Feedback[] };

// Grupos do NPS: 0–6 detrator, 7–8 neutro, 9–10 promotor.
export type NpsGroup = "detractor" | "passive" | "promoter";

export function npsGroup(score: number): NpsGroup {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}
