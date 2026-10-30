-- Resumo das avaliações escrito pelo agente de IA (Mastra + gpt-4o-mini).
-- Fica gravado no produto para não chamar o modelo a cada visita.
-- `ai_summary_source` guarda de quais avaliações o resumo saiu
-- ("{quantidade}:{id da mais recente}"); quando muda, o resumo é refeito.
alter table public.products
  add column if not exists ai_summary text,
  add column if not exists ai_summary_source text,
  add column if not exists ai_summary_updated_at timestamptz;
