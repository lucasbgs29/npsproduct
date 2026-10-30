# Plano: Sign-In (autenticação)

Spec: `specs/sign-in.md` · Pré-requisito: Fase 0 de `plans/_orquestracao.md`

## Objetivo
Uma pessoa com conta entra com email e senha em `/auth/sign-in`. Uma sessão em cookie é criada e ela volta para `/`. O cabeçalho da plataforma mostra "Entrar" para quem não está logado e, para quem está, avatar + nome + sobrenome + email.

## Back-end

### Schema: `src/lib/validations/sign-in.ts`
- `email`: trim, minúsculas, `z.email(...)`. Mesma regra do sign-up.
- `password`: `z.string().min(1, "Digite sua senha.")`. Não repete as regras de força: no login isso só serviria para revelar a política de senha.
- Tipos `SignInInput`, `SignInData`, `SignInResponse = { firstName, lastName, email }`.

### Sessão: `src/server/auth/session.ts` (implementar o contrato da Fase 0)
- `iron-session` (`sealData`/`unsealData`) com `SESSION_SECRET`. Cookie `nps_session` com `httpOnly`, `secure` em produção, `sameSite: "lax"`, `path: "/"` e validade de 7 dias.
- O cookie guarda `{ accountId, firstName, lastName, email }`. Assim o cabeçalho não precisa consultar o banco a cada requisição.
- `getSession()` lê com `cookies()` dentro de `"use cache: private"`, como manda o guia de auth com Cache Components. Selo inválido ou expirado retorna `null`.

### Procedure: `authRouter.signIn` em `src/server/routers/auth.ts`
1. Busca em `accounts` por `email` (o índice usa `lower(email)` e o schema já normaliza). Seleciona `id, first_name, last_name, email, password, active`.
2. **Tempo constante**: se a conta não existe, roda `bcrypt.compare` contra um hash fictício para o tempo de resposta não revelar quais emails existem.
3. Conta não encontrada, senha errada ou `active = false` lançam `UNAUTHORIZED` com a mesma mensagem: **"Email ou senha inválidos."**
4. Sucesso: retorna os dados da conta (sem o hash). A rota cria a sessão.

### Rota: `src/app/api/v1/sign-in/route.ts`
- `POST`, JSON no body. Mesma estrutura de `sign-up/route.ts`.
- `200` com `SignInResponse` e o cookie de sessão definido via `createSession`.
- `400` para JSON malformado ou falha do Zod (com `issues`).
- `401` para credenciais erradas (mensagem genérica).
- `500` genérico, com o erro logado só no servidor.

### Sign-out: `src/app/api/v1/sign-out/route.ts` (ver decisão D1)
- `POST` → `destroySession()` → `204`.

## Front-end

### Página `/auth/sign-in`
- `src/app/auth/sign-in/page.tsx` + `sign-in-form.tsx` (client), dentro do `auth/layout.tsx` que já existe.
- React Hook Form + `zodResolver(signInSchema)`, `mode: "onTouched"`, React Query `useMutation` com `fetch` para `/api/v1/sign-in`.
- Erro: `Alert variant="destructive"` vermelho com título "Não foi possível entrar" e a mensagem da API.
- Sucesso: `router.push("/")` + `router.refresh()`, para o cabeçalho reler a sessão.
- Links cruzados: "Ainda não tem conta? Criar conta" → `/auth/sign-up`, e o inverso na página de sign-up. Essa é a única mudança permitida no sign-up.
- Visual: mesma linguagem do sign-up (régua, tipografia). Seguindo a skill, a régua pode aparecer em versão mais discreta, sem repetir a animação de progresso, que é a assinatura do cadastro. A direção final vai para `design-notes`.

### Cabeçalho: `src/components/site-header.tsx` (preencher o esqueleto da Fase 0)
- Server Component: logo "NPSproduct" (link para `/`) à esquerda. À direita, um `<Suspense>` com a parte que depende da sessão, conforme o guia: ler a sessão não pode fazer parte do static shell.
- Sem sessão: botão "Entrar" → `/auth/sign-in`.
- Com sessão: `src/components/user-menu.tsx` com avatar DiceBear (`https://api.dicebear.com/9.x/initials/svg?seed=<nome sobrenome>`, `<img>` com `alt` vazio porque o nome aparece ao lado), nome + sobrenome e email. Botão "Sair" chama `/api/v1/sign-out` e faz `router.refresh()`.
- Fallback do Suspense: placeholder do mesmo tamanho, para o layout não pular.

### Home esqueleto
A spec pede "uma home com título e esqueleto", mas a feature **home** é dona de `(platform)/page.tsx` e roda em paralelo. O sign-in **não** mexe na home: o placeholder da Fase 0 cobre esse item.

## Critérios de aceitação → verificação
| Critério | Como verificar |
|---|---|
| Página `/auth/sign-in` com formulário validado | Abrir a página e enviar vazio ou com email inválido: erros aparecem por campo, sem requisição |
| Comunica com a API | Enviar dados válidos com o Supabase configurado. Sem Supabase: confirmar o `500` genérico tratado |
| Erros em alert vermelho | `401` mostra "Email ou senha inválidos." |
| Sucesso navega para `/` | Após o `200`, URL `/` e avatar no cabeçalho |
| `400` / `401` corretos | `curl` com JSON quebrado (400), campos faltando (400) e senha errada (401) |
| Lint e tipos | `npm run lint`, `npx tsc --noEmit` |

## Fora do escopo
Recuperação de senha, "lembrar de mim", OAuth, envio de email, proteção de rotas por proxy.

## Decisões para você aprovar
- **D1, sign-out**: a spec não pede, mas sem ele o avatar vira beco sem saída. *Recomendo incluir* (uma rota + um botão).
- **D2, conta inativa**: tratar `active = false` como credencial inválida (401 genérico). *Recomendo assim*, para não revelar que a conta existe.
- **D3, validade da sessão**: 7 dias, sem renovação automática.
