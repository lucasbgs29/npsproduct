import { z } from "zod";

/** Quantos produtos a home carrega por vez. */
export const PRODUCTS_PAGE_SIZE = 12;

// Só aceita links web (http/https), nunca `javascript:` ou `data:`.
const webUrl = (message: string) =>
  z.url({ protocol: /^https?$/, hostname: z.regexes.domain, message });

// Parâmetros de `GET /api/v1/products` (chegam como texto na query string).
export const listProductsSchema = z.object({
  // Cursor opaco devolvido em `nextCursor` (base64url de `created_at|id`).
  cursor: z
    .string()
    .max(200, "Cursor inválido.")
    .regex(/^[A-Za-z0-9_-]+$/, "Cursor inválido.")
    .optional(),
  limit: z.coerce
    .number("O limite deve ser um número.")
    .int("O limite deve ser um número inteiro.")
    .min(1, "O limite deve ser pelo menos 1.")
    .max(50, "O limite pode ser no máximo 50.")
    .default(PRODUCTS_PAGE_SIZE),
});

export type ListProductsInput = z.input<typeof listProductsSchema>;

// Corpo de `POST /api/v1/products` (cadastro público de produtos).
// `link` vira `external_link` e `image` vira `image_url` no banco.
export const createProductSchema = z.object({
  name: z
    .string("Informe o nome do produto.")
    .trim()
    .min(1, "Informe o nome do produto.")
    .max(200, "O nome deve ter no máximo 200 caracteres."),
  link: webUrl("Informe um link válido, começando com http:// ou https://."),
  image: webUrl("Informe a URL da imagem, começando com http:// ou https://."),
});

export type CreateProductInput = z.input<typeof createProductSchema>;

export type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalLink: string;
  /** Média das avaliações, de 0 a 10. `null` enquanto não há avaliações. */
  score: number | null;
  createdAt: string;
};

export type ProductPage = {
  items: Product[];
  /** `null` quando não há mais produtos. */
  nextCursor: string | null;
};
