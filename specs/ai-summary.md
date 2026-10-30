# Resumo de IA das avaliações

## Escopo
Front-End, Back-End, Banco de Dados

## Contexto
Produtos com muitas avaliações são difíceis de ler por inteiro. Precisamos de um resumo geral, escrito por IA, com o que as pessoas mais elogiam e criticam em cada produto.

## Requisitos funcionais
1. Novo agente Mastra (`src/mastra/agents/feedback-summary-agent.ts`) usando `openai/gpt-4o-mini`
2. O agente recebe todas as avaliações (nota + comentário) do produto e devolve um resumo geral em pt-BR
3. O resumo aparece na página `/products/[id]`, entre as informações do produto e as avaliações, destacado como "Gerado por IA"
4. Novas colunas em `products`: `ai_summary`, `ai_summary_source`, `ai_summary_updated_at`
5. O resumo é refeito só quando o conjunto de avaliações muda (nova avaliação)

## Requisitos não funcionais
- Performance: a página não espera o modelo; o resumo chega via streaming (`<Suspense>`)
- Custo: no máximo uma chamada ao modelo por mudança nas avaliações (resumo gravado no banco)
- Segurança: comentários são tratados como dados; o agente ignora instruções dentro deles

## Você deve
- Mostrar aviso de que o texto foi escrito por IA e pode conter imprecisões
- Esconder a seção quando o produto não tem avaliações

## Você não deve
- Bloquear a página se a OpenAI falhar: mostrar uma mensagem e seguir com as avaliações

## Tecnologias (Stack)
Mastra (`@mastra/core`), OpenAI gpt-4o-mini, Next.js, Supabase.

## Critérios de aceitação
- Produto com avaliações mostra o bloco "Resumo das avaliações" com o selo "Gerado por IA"
- Após uma nova avaliação, o próximo acesso mostra um resumo atualizado

## Resultado
Pessoas entendem a opinião geral sobre o produto sem ler todas as avaliações.
