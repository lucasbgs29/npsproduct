# NPSproduct

Plataforma de avaliação de produtos no estilo NPS: cada pessoa dá uma nota de 0 a 10 a um produto e deixa um comentário. A página do produto mostra a média, a distribuição das notas e um resumo das avaliações escrito por IA.

Projeto do módulo de Engajamento e Sistemas de Avaliação de Produto (pós-graduação).

## Funcionalidades

- Cadastro, login e logout com sessão em cookie criptografado (`iron-session`) e senha com hash (`bcryptjs`).
- Lista de produtos com rolagem infinita (12 por página).
- Página do produto com média, distribuição das notas e formulário de avaliação.
- Resumo das avaliações gerado por um agente Mastra (`gpt-4o-mini`), gravado no banco e refeito só quando chegam avaliações novas.

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn** (componentes base)
- **tRPC** + **React Query** (API e cache de dados no cliente)
- **Supabase** (PostgreSQL)
- **Mastra** + OpenAI (resumo das avaliações)
- **Biome** (lint e formatação)
- **Vercel** (hospedagem)

Mais detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). As especificações de cada funcionalidade ficam em [`specs/`](specs/) e os planos de implementação em [`plans/`](plans/).

## Estrutura de pastas

```
src/
  app/          Páginas e rotas de API (App Router)
    (platform)/ Home e página do produto
    auth/       Cadastro e login
    api/v1/     Rotas HTTP (sign-in, sign-up, sign-out, produtos, avaliações)
  components/   Componentes compartilhados e de UI
  lib/          Utilitários e validações (zod)
  mastra/       Agente de IA que resume as avaliações
  server/       tRPC, autenticação, acesso ao banco e IA
supabase/
  migrations/   Criação das tabelas
  seed.sql      Produtos de exemplo
```

## Como rodar localmente

Pré-requisitos: Node.js 20 ou superior, um projeto no [Supabase](https://supabase.com) e uma chave da [OpenAI](https://platform.openai.com).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o banco: no painel do Supabase, abra o **SQL Editor** e rode, em ordem, os arquivos de `supabase/migrations/`. Depois rode `supabase/seed.sql` para ter produtos de exemplo.

3. Copie `.env.example` para `.env.local` e preencha as variáveis (veja a tabela abaixo).

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase (Project Settings > API). |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role do Supabase. Usada só no servidor; nunca exponha no cliente. |
| `SESSION_SECRET` | Segredo de no mínimo 32 caracteres para criptografar o cookie de sessão. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. |
| `OPENAI_API_KEY` | Chave da OpenAI usada pelo agente que resume as avaliações. |

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | Verifica o código com o Biome |
| `npm run format` | Formata o código com o Biome |

## Deploy na Vercel

1. Envie o código para o GitHub.
2. Na [Vercel](https://vercel.com/new), importe o repositório. O framework (Next.js) é detectado sozinho.
3. Em **Environment Variables**, cadastre as quatro variáveis da tabela acima.
4. Clique em **Deploy**. A cada `git push` na `main`, a Vercel publica uma nova versão.
