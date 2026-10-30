import "server-only";

import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  createProductSchema,
  listProductsSchema,
  type Product,
  type ProductPage,
} from "@/lib/validations/products";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { publicProcedure, router } from "@/server/trpc";

const PRODUCT_COLUMNS =
  "id, name, description, image_url, external_link, score, created_at";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string;
  score: number | string | null;
  created_at: string;
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    externalLink: row.external_link,
    // `numeric` pode chegar como texto, dependendo da precisão.
    score: row.score === null ? null : Number(row.score),
    createdAt: row.created_at,
  };
}

// timestamptz como o PostgREST devolve, ex.: 2026-10-28T12:00:00.123456+00:00
const TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:\d{2})?)?$/;

// O cursor guarda a última linha vista: `created_at` (texto original do banco,
// sem perder os microssegundos) e `id` para desempatar.
function encodeCursor(row: ProductRow): string {
  return Buffer.from(`${row.created_at}|${row.id}`).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const [createdAt, id, ...rest] = Buffer.from(cursor, "base64url")
    .toString("utf8")
    .split("|");

  if (
    rest.length > 0 ||
    !createdAt ||
    !id ||
    // Formatos estritos: os valores entram no filtro `or` do PostgREST.
    !TIMESTAMP.test(createdAt) ||
    !/^[A-Za-z0-9_-]+$/.test(id)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cursor inválido. Recarregue a lista de produtos.",
    });
  }

  return { createdAt, id };
}

export const productsRouter = router({
  // Paginação por cursor (created_at desc, id desc): produtos novos
  // cadastrados durante a rolagem não duplicam nem pulam itens.
  list: publicProcedure
    .input(listProductsSchema)
    .query(async ({ input }): Promise<ProductPage> => {
      let query = getSupabaseAdmin()
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        // Uma linha a mais só para saber se existe próxima página.
        .limit(input.limit + 1);

      if (input.cursor) {
        const { createdAt, id } = decodeCursor(input.cursor);
        query = query.or(
          `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`,
        );
      }

      const { data, error } = await query.returns<ProductRow[]>();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível listar os produtos.",
          cause: error,
        });
      }

      const rows = data.slice(0, input.limit);
      const hasMore = data.length > input.limit;

      return {
        items: rows.map(toProduct),
        nextCursor: hasMore ? encodeCursor(rows[rows.length - 1]) : null,
      };
    }),

  // Pública: qualquer cliente pode cadastrar produtos pela rota REST.
  create: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input }): Promise<Product> => {
      const { data, error } = await getSupabaseAdmin()
        .from("products")
        .insert({
          id: nanoid(),
          name: input.name,
          image_url: input.image,
          external_link: input.link,
        })
        .select(PRODUCT_COLUMNS)
        .single<ProductRow>();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível cadastrar o produto.",
          cause: error,
        });
      }

      return toProduct(data);
    }),
});
