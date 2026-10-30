import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  createFeedbackProcedureSchema,
  type Feedback,
  type ProductDetail,
  productDetailSchema,
} from "@/lib/validations/feedbacks";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc";

const PRODUCT_COLUMNS =
  "id, name, description, image_url, external_link, score, created_at";

// Join com `accounts` só para o nome: o email nunca entra no select.
const FEEDBACK_COLUMNS =
  "id, score, comment, created_at, author:accounts(first_name, last_name)";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string;
  score: number | string | null;
  created_at: string;
};

type AuthorRow = { first_name: string; last_name: string };

type FeedbackRow = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  author: AuthorRow | AuthorRow[] | null;
};

function toFeedback(row: FeedbackRow): Feedback {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  return {
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
    author: {
      firstName: author?.first_name ?? "Pessoa",
      lastName: author?.last_name ?? "removida",
    },
  };
}

function internalError(message: string, cause: unknown): TRPCError {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message, cause });
}

const productNotFound = () =>
  new TRPCError({
    code: "NOT_FOUND",
    message: "Este produto não existe ou foi removido.",
  });

export const feedbacksRouter = router({
  productDetail: publicProcedure
    .input(productDetailSchema)
    .query(async ({ input }): Promise<ProductDetail> => {
      const supabase = getSupabaseAdmin();

      const [product, feedbacks] = await Promise.all([
        supabase
          .from("products")
          .select(PRODUCT_COLUMNS)
          .eq("id", input.productId)
          .maybeSingle<ProductRow>(),
        supabase
          .from("products_feedbacks")
          .select(FEEDBACK_COLUMNS)
          .eq("product_id", input.productId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .returns<FeedbackRow[]>(),
      ]);

      if (product.error) {
        throw internalError(
          "Não foi possível carregar o produto.",
          product.error,
        );
      }
      if (!product.data) throw productNotFound();
      if (feedbacks.error) {
        throw internalError(
          "Não foi possível carregar as avaliações.",
          feedbacks.error,
        );
      }

      const row = product.data;

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        externalLink: row.external_link,
        score: row.score === null ? null : Number(row.score),
        createdAt: row.created_at,
        feedbacks: (feedbacks.data ?? []).map(toFeedback),
      };
    }),

  create: protectedProcedure
    .input(createFeedbackProcedureSchema)
    .mutation(async ({ ctx, input }): Promise<Feedback> => {
      const supabase = getSupabaseAdmin();

      const product = await supabase
        .from("products")
        .select("id")
        .eq("id", input.productId)
        .maybeSingle();

      if (product.error) {
        throw internalError(
          "Não foi possível conferir o produto.",
          product.error,
        );
      }
      if (!product.data) throw productNotFound();

      // O autor vem só da sessão, nunca do corpo da requisição.
      const { data, error } = await supabase
        .from("products_feedbacks")
        .insert({
          id: nanoid(),
          score: input.score,
          comment: input.comment,
          created_by: ctx.session.accountId,
          product_id: input.productId,
        })
        .select("id, score, comment, created_at")
        .single();

      if (error) {
        throw internalError("Não foi possível salvar a avaliação.", error);
      }

      return {
        id: data.id,
        score: data.score,
        comment: data.comment,
        createdAt: data.created_at,
        author: {
          firstName: ctx.session.firstName,
          lastName: ctx.session.lastName,
        },
      };
    }),
});
