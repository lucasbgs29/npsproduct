-- Tabela de produtos listados na home e avaliados pela feature feedback.
-- O `id` e gerado com nanoid na camada de API.
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  -- URL publica da imagem (sem upload para o Storage por enquanto).
  image_url text,
  external_link text not null,
  -- Media das avaliacoes (0 a 10). Nula enquanto nao houver avaliacoes.
  -- Quem mantem este valor e a feature feedback (trigger em products_feedbacks).
  score numeric(4,2) check (score between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Paginacao por cursor da home: order by created_at desc, id desc.
create index if not exists products_created_at_id_idx
  on public.products (created_at desc, id desc);

-- Reaproveita public.set_updated_at(), criada na migration de accounts.
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- Sem policies: apenas a API, usando a service role key, le e escreve.
alter table public.products enable row level security;
