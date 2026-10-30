# Plano: Feedback (avaliações de produto)

Spec: `specs/feedback.md` · Pré-requisito: Fase 0 de `plans/_orquestracao.md`

## Objetivo
`/products/{id}` é pública e mostra o produto e todas as avaliações. Quem está logado vê o formulário de nova avaliação (nota + comentário) logo abaixo. Quem não está vê um bloco pedindo para entrar.

## Dependências em paralelo
- **Sessão** (sign-in): usa só `getSession()` e `protectedProcedure`, contratos da Fase 0. Enquanto o sign-in não termina, `getSession()` retorna `null` e a página mostra o bloco "entre para avaliar". Isso já testa esse caminho.
- **Tabela `products`** (home): a migration deste plano tem timestamp posterior e referencia `products(id)`. Para ler o produto, uso as colunas combinadas no plano da home (`id, name, description, image_url, external_link, score, created_at`).

## Banco: `supabase/migrations/20261028000100_create_products_feedbacks.sql`
```sql
create table if not exists public.products_feedbacks (
  id text primary key,                                   -- nanoid na API
  score int not null check (score between 0 and 10),     -- 0–10 (decisão D1 aprovada)
  comment text not null check (char_length(comment) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by text not null references public.accounts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade
);
create index if not exists products_feedbacks_product_idx
  on public.products_feedbacks (product_id, created_at desc);
alter table public.products_feedbacks enable row level security; -- só a service role acessa
```
Trigger que recalcula `products.score` (média 0–10, 2 casas) a cada insert.

## Back-end

### Schemas: `src/lib/validations/feedbacks.ts`
- `createFeedbackSchema`: `score` (`z.int().min(0).max(10)`, mensagem "Escolha uma nota de 0 a 10.") e `comment` (trim, 1–2000, mensagem "Escreva um comentário sobre o produto.").
- Tipos `Feedback = { id, score, comment, createdAt, author: { firstName, lastName } }` e `ProductDetail = Product & { feedbacks: Feedback[] }`.

### Procedures: `src/server/routers/feedbacks.ts`
- `productDetail` (public, input `{ productId }`): produto + avaliações (join com `accounts` só para `first_name, last_name`, **nunca** email) em ordem da mais recente. Produto inexistente → `NOT_FOUND`.
- `create` (`protectedProcedure`, input `{ productId, score, comment }`): confere se o produto existe (404), gera `nanoid()`, `created_by = ctx.session.accountId` e insere. O autor vem **só** da sessão, nunca do body.

### Rota: `src/app/api/v1/products/[id]/feedbacks/route.ts`
- `POST`, JSON `{ score, comment }`. Cria o caller com `{ session: await getSession() }`.
- `201` com a avaliação criada. `400` para dados inválidos (com `issues`). `401` sem sessão ("Entre na sua conta para avaliar."). `404` se o produto não existe. `500` genérico.
- Depois de inserir: `revalidateTag(`product-${id}`)` para a página mostrar a avaliação nova.

## Front-end

### `src/app/(platform)/products/[id]/page.tsx`
- `params` é Promise no Next 16 (`await params`, ver `dynamic-routes.md`).
- Dados públicos do produto e das avaliações em função com `"use cache"` + `cacheTag(`product-${id}`)`. Produto inexistente → `notFound()` + `not-found.tsx` próprio ("Este produto não existe ou foi removido." com link para a home).
- `generateMetadata` com o nome do produto.
- Estrutura:
  1. **Produto**: imagem, nome, descrição, média e quantidade de avaliações, link externo ("Ver na loja", `target="_blank" rel="noopener noreferrer"`).
  2. **Avaliações**: lista com nota, comentário, nome + sobrenome e data relativa (`date-fns` com locale `ptBR`, `formatDistanceToNow`). Sem avaliações: "Ninguém avaliou este produto ainda. Seja a primeira pessoa."
  3. **Formulário ou bloco de autenticação**: dentro de `<Suspense>`, porque lê a sessão:
     - Sem sessão: bloco "Entre para avaliar este produto" com botões "Entrar" (`/auth/sign-in`) e "Criar conta" (`/auth/sign-up`). Voltar para o produto depois do login fica fora do escopo (ver decisão D3).
     - Com sessão: `feedback-form.tsx` (client).

### `feedback-form.tsx`
- React Hook Form + `zodResolver`, React Query `useMutation` para `POST /api/v1/products/{id}/feedbacks`.
- Nota de 0 a 10 como **radiogroup acessível** (setas do teclado, foco visível, `aria-label` "Nota 7 de 10"). Visualmente é a régua NPS de 11 posições: reaproveitar ou estender `src/app/auth/nps-ruler.tsx` em modo interativo, com 9–10 em verde promotor e 0–6 em vermelho detrator.
- Comentário em `textarea` com contador de caracteres.
- Sucesso: limpa o formulário, `router.refresh()` e mostra uma confirmação curta ("Sua avaliação foi publicada."). Erro: `Alert` destrutivo com a mensagem da API.

### Visual
Seguir a skill frontend-design e a direção "régua". O elemento marcante desta página é a distribuição das notas (quantas avaliações em cada nota de 0 a 10) desenhada como régua, com o NPS do produto (% promotores − % detratores). O resto fica quieto. A direção vai para `design-notes` antes de implementar.

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Detalhes mostram produto + avaliações + formulário | Logado, com o seed: as três seções aparecem |
| Público sem autenticação | Aba anônima: produto e avaliações visíveis, bloco "Entre para avaliar" no lugar do formulário |
| Só logado avalia | `curl POST` sem cookie → 401 |
| Validação | Nota -1 ou 11, ou comentário vazio → erro no formulário e 400 na API |
| Avaliação nova aparece | Após o 201, ela está no topo da lista e a média é atualizada |
| Produto inexistente | `/products/xyz` → página 404 própria |
| Lint e tipos | `npm run lint`, `npx tsc --noEmit` |

## Fora do escopo
Editar ou excluir avaliações, curtir, responder, moderação, paginação das avaliações, envio de email.

## Decisões para você aprovar
- **D1, escala — APROVADA: 0–10** (régua NPS), em vez do 1–5 da spec.
- **D2, uma avaliação por pessoa por produto?** A spec não limita. *Recomendo permitir várias* (como está na spec). Alternativa: índice único `(product_id, created_by)`.
- **D3, voltar ao produto após o login** (`?next=/products/{id}`): melhora a experiência, mas mexe no sign-in. *Recomendo deixar para depois*, para não cruzar a posse de arquivos.
- **D4, paginação das avaliações**: a spec pede "listar todos". *Sigo listando tudo*, o que basta para o projeto.
