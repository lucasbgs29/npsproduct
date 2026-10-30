# Plano: Home (listagem de produtos)

Spec: `specs/home.md` · Pré-requisito: Fase 0 de `plans/_orquestracao.md`

## Objetivo
Qualquer pessoa, logada ou não, abre `/` e vê os produtos em uma lista com rolagem infinita. Cada item mostra imagem, nome e uma descrição curta. Clicar no nome leva para `/products/{id}`, página feita pela feature **feedback**.

## Banco: `supabase/migrations/20261028000000_create_products.sql`
```sql
create table if not exists public.products (
  id text primary key,                 -- nanoid gerado na API
  name text not null,
  description text,                    -- opcional
  image_url text,                      -- ver decisão D1
  external_link text not null,
  score numeric(4,2),                  -- média 0–10 das avaliações (D2 aprovada)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_created_at_id_idx on public.products (created_at desc, id desc);
-- trigger de updated_at reaproveitando public.set_updated_at() (já existe)
alter table public.products enable row level security; -- só a service role acessa
```

## Back-end

### Schemas: `src/lib/validations/products.ts`
- `listProductsSchema`: `cursor?: string` (opaco, base64 de `created_at|id`) e `limit` de 1 a 50, padrão 12.
- `createProductSchema`: `name` (1–200), `link` (`z.url()`, só http/https) e `image` (`z.url()`), gravados em `external_link` e `image_url`.
- Tipos `Product = { id, name, description, imageUrl, externalLink, score, createdAt }` e `ProductPage = { items: Product[]; nextCursor: string | null }`.

### Procedures: `src/server/routers/products.ts`
- `list` (public): paginação **por cursor** (`created_at desc, id desc`), mais estável que offset quando entra produto novo durante a rolagem. Busca `limit + 1` linhas para saber se existe próxima página.
- `create` (public, sem autenticação): gera `nanoid()`, insere e retorna `Product`.
- `getById` **não** entra aqui. Fica com a feature feedback.

### Rotas: `src/app/api/v1/products/route.ts`
- `GET /api/v1/products?cursor=&limit=` → `200` com `{ items, nextCursor }`. Sem produtos, `items: []` (ver decisão D3). Parâmetros inválidos → `400`.
- `POST /api/v1/products` (JSON: `name`, `link`, `image`) → `201` com o produto.
  - Pública, sem autenticação (ver decisão D4).
  - A spec diz `POST /products`. Uso `/api/v1/products` para seguir o padrão das outras rotas (ver decisão D5).
- Tratamento de erro igual ao de `sign-up/route.ts`.

### Dados de exemplo
`supabase/seed.sql` com cerca de 20 produtos variados (eletrônicos, casa, livros…) e imagens de URLs públicas estáveis. Assim dá para testar a rolagem infinita assim que o Supabase for conectado.

## Front-end

### `src/app/(platform)/page.tsx` (substitui o placeholder da Fase 0)
- Server Component com o título da página e uma frase curta sobre o produto. A primeira página da lista vem do servidor dentro de `<Suspense>` (com Cache Components, a leitura do banco fica atrás de Suspense ou em `use cache`; a lista pública pode usar `"use cache"` + `cacheLife("minutes")` + `cacheTag("products")`).
- `src/app/(platform)/product-list.tsx` (client): `useInfiniteQuery` (React Query) com `initialData` vindo do servidor, buscando `GET /api/v1/products?cursor=…`.
- **Rolagem infinita**: `IntersectionObserver` em um sentinela no fim da lista (com `rootMargin` para buscar antes de chegar ao fim). Também um botão "Carregar mais produtos" acessível por teclado e fallback se o observer falhar.
- Estados: skeleton de carregamento (mesma altura dos itens), lista vazia ("Nenhum produto cadastrado ainda."), erro com "Tentar novamente" e fim da lista ("Você viu todos os produtos.").
- Item: imagem (`next/image` com `unoptimized`, proporção fixa e `alt` com o nome), nome como `<Link href={`/products/${id}`}>` e descrição limitada a 2–3 linhas (`line-clamp`). O link externo **não** aparece na home: ele fica nos detalhes.

### Visual
Seguir a skill frontend-design e a direção "régua". Fugir da grade de cards SaaS genérica (mesma sombra e mesmo raio em tudo). Proposta a validar no primeiro passo do subagent: lista editorial com imagem à esquerda e texto à direita no desktop, empilhada no mobile, separando os itens pelo ritmo tipográfico em vez de cards. A direção tem que ser registrada em `design-notes` antes de implementar.

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Home lista os produtos | Com o seed: `/` mostra os 12 primeiros |
| Rolagem infinita | Rolar até o fim carrega a próxima página, e o fim da lista aparece |
| `GET` retorna 200 / vazio | `curl /api/v1/products` com a tabela vazia → `{ "items": [], "nextCursor": null }` |
| `POST` manual | `curl` com token → 201. Sem token → 401. URL inválida → 400 |
| Clique no nome navega | Vai para `/products/{id}` (404 até a feature feedback entrar) |
| Pública | Funciona em aba anônima, sem cookie |
| Lint e tipos | `npm run lint`, `npx tsc --noEmit` |

## Fora do escopo
Busca, filtros, ordenação, upload de imagem, edição e remoção de produtos, página de detalhes.

## Decisões para você aprovar
- **D1, imagem**: a spec pede imagem no POST e na listagem, mas a tabela não tem a coluna. *Recomendo `image_url text` com uma URL*, sem upload para o Supabase Storage.
- **D2, `score: boolean`**: provavelmente é um erro na spec. **APROVADA:** `score numeric(4,2)` nulo, com a média das avaliações (0–10) e é mostrado na home quando existir. Quem atualiza a média é a feature feedback (ver o plano dela). Alternativa: remover a coluna e calcular na hora.
- **D3, formato do GET**: a spec diz "array vazio". *Recomendo `{ items: [], nextCursor: null }`*, porque a rolagem infinita precisa do cursor. Alternativa: array puro com o cursor em um header.
- **D4, proteção do POST**: sem proteção, qualquer pessoa cadastra produtos. **ALTERADA:** a rota ficou pública, sem token, a pedido do usuário.
- **D5, caminho do POST**: `/api/v1/products` em vez de `/products`. *Recomendo assim*, porque `/products` é rota de página.
