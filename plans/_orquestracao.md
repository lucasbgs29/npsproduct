# Orquestração: sign-in, home e feedback em paralelo

As três features rodam em paralelo, mas dependem umas das outras:

- **feedback** precisa da sessão criada no **sign-in** e da tabela `products` criada no **home**.
- **home** e **feedback** aparecem dentro do layout da plataforma (cabeçalho), que é criado no **sign-in**.
- As três mexeriam nos mesmos arquivos (`_app.ts`, `next.config.ts`, `package.json`, `src/app/page.tsx`).

Para evitar conflito, eu (orquestrador) faço uma **Fase 0** antes de subir os subagents: crio os contratos compartilhados e os arquivos de esqueleto. Depois disso cada subagent só edita os arquivos que são dele (tabela de posse abaixo).

## Fase 0: feita pelo orquestrador antes dos subagents

1. **Dependência nova**: `npm install iron-session` (sessão em cookie criptografado, o padrão do guia `authentication-with-cache-components.md` do Next 16). O projeto usa `npm` (tem `package-lock.json`), não Bun.
2. **`.env.example`**: adicionar `SESSION_SECRET` (mínimo 32 caracteres) e `ADMIN_API_TOKEN` (protege o cadastro manual de produtos).
3. **Contrato de sessão**: `src/server/auth/session.ts` com a interface final e implementação provisória que retorna `null`:
   ```ts
   export type Session = { accountId: string; firstName: string; lastName: string; email: string };
   export async function getSession(): Promise<Session | null>;
   export async function createSession(session: Session): Promise<void>;
   export async function destroySession(): Promise<void>;
   ```
   O **sign-in** implementa. O **feedback** só importa `getSession`.
4. **tRPC com contexto**: `src/server/trpc.ts` ganha `Context = { session: Session | null }` e uma `protectedProcedure` (lança `UNAUTHORIZED` sem sessão). O `createCaller({})` atual do sign-up passa a ser `createCaller({ session: null })`.
5. **Routers registrados**: `src/server/routers/products.ts` e `src/server/routers/feedbacks.ts` vazios, já registrados em `_app.ts`. Cada subagent preenche só o seu.
6. **Layout da plataforma**: route group `src/app/(platform)/layout.tsx` que renderiza `<SiteHeader />` (de `src/components/site-header.tsx`, esqueleto) + `<main>`. Remover o redirect de `src/app/page.tsx` e criar `src/app/(platform)/page.tsx` provisório.
7. **Imagens**: imagens de produto e avatares do DiceBear usam `<img>`/`next/image` com `unoptimized`, então `next.config.ts` não muda. Fica registrado para nenhum subagent mexer nesse arquivo.
8. **Nomes das migrations** (a ordem importa por causa das chaves estrangeiras):
   - home: `supabase/migrations/20261028000000_create_products.sql`
   - feedback: `supabase/migrations/20261028000100_create_products_feedbacks.sql`

## Posse de arquivos

| Arquivo / pasta | Dono |
|---|---|
| `src/server/auth/session.ts` (implementação), `src/app/api/v1/sign-in/**`, `src/app/api/v1/sign-out/**`, `src/app/auth/sign-in/**`, `src/lib/validations/sign-in.ts`, `src/components/site-header.tsx`, `src/components/user-menu.tsx`, `src/server/routers/auth.ts` (só adiciona `signIn`) | sign-in |
| `src/app/(platform)/page.tsx`, `src/app/(platform)/product-list*.tsx`, `src/app/api/v1/products/route.ts`, `src/server/routers/products.ts`, `src/lib/validations/products.ts`, migration de `products` | home |
| `src/app/(platform)/products/[id]/**`, `src/app/api/v1/products/[id]/feedbacks/**`, `src/server/routers/feedbacks.ts`, `src/lib/validations/feedbacks.ts`, migration de `products_feedbacks` | feedback |
| `package.json`, `next.config.ts`, `src/server/trpc.ts`, `src/server/routers/_app.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example` | orquestrador (subagent que precisar mudar pede no relatório final) |

Componentes Shadcn novos (`src/components/ui/*`): cada subagent pode adicionar, mas não pode alterar os que já existem.

## Regras para os três subagents

- Ler `AGENTS.md` e o guia relevante em `node_modules/next/dist/docs/` antes de escrever código (Next 16.4 com `cacheComponents: true`).
- UI: seguir a skill `.agents/skills/frontend-design/SKILL.md` e a direção visual aprovada, "a régua" (tokens `--ink`, `--graphite`, `--ruler`, `--promoter`, Big Shoulders + Atkinson Hyperlegible Next, sem Card genérico nem gradiente). Reaproveitar `src/app/auth/nps-ruler.tsx` quando fizer sentido.
- Seguir os padrões do sign-up: schema Zod compartilhado em `src/lib/validations/`, procedure tRPC exposta como rota REST em `src/app/api/v1/**/route.ts`, `ApiErrorResponse` nos erros, textos em pt-BR.
- Rodar `npm run lint` e `npx tsc --noEmit` antes de terminar. O Supabase ainda não está conectado, então não dá para testar contra o banco de verdade. O relatório final precisa dizer o que foi e o que não foi verificado.
- Não editar arquivos de outro dono. Se precisar de algo, registrar no relatório.

## Fase final: integração (orquestrador)

1. Revisar os diffs dos três, conferindo a posse de arquivos.
2. `npm run lint`, `npx tsc --noEmit`, `npm run build`.
3. Subir `npm run dev` e percorrer o fluxo: home anônima → detalhes com o bloco "entre para avaliar" → sign-in → avatar no cabeçalho → nova avaliação. A parte que depende do banco só roda quando o Supabase estiver configurado.
4. Atualizar a memória do projeto com o estado final.
## Status: todas as decisões aprovadas em 2026-10-28 (D1 da feature feedback = escala 0–10).
