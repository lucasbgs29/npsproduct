-- Avaliações de produtos: nota de 0 a 10 (régua NPS) + comentário.
-- O `id` é gerado com nanoid na camada de API.
-- Depende de `accounts` (sign-up) e de `products` (20261028000000_create_products.sql).
create table if not exists public.products_feedbacks (
  id text primary key,
  score int not null check (score between 0 and 10),
  comment text not null check (char_length(comment) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by text not null references public.accounts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade
);

-- A página do produto lista as avaliações da mais recente para a mais antiga.
create index if not exists products_feedbacks_product_idx
  on public.products_feedbacks (product_id, created_at desc);

-- Chave estrangeira sem índice deixa lento o cascade ao remover uma conta.
create index if not exists products_feedbacks_created_by_idx
  on public.products_feedbacks (created_by);

-- Mantém `products.score` com a média (0 a 10, 2 casas) das avaliações.
-- Fica `null` quando o produto não tem nenhuma avaliação.
create or replace function public.refresh_product_score()
returns trigger
language plpgsql
as $$
declare
  target_product_id text;
begin
  if tg_op = 'DELETE' then
    target_product_id := old.product_id;
  else
    target_product_id := new.product_id;
  end if;

  update public.products
     set score = (
       select round(avg(f.score)::numeric, 2)
         from public.products_feedbacks f
        where f.product_id = target_product_id
     )
   where id = target_product_id;

  return null;
end;
$$;

drop trigger if exists products_feedbacks_refresh_score on public.products_feedbacks;
create trigger products_feedbacks_refresh_score
  after insert or delete on public.products_feedbacks
  for each row
  execute function public.refresh_product_score();

-- Sem policies: só a API, usando a service role key, lê e escreve.
alter table public.products_feedbacks enable row level security;
