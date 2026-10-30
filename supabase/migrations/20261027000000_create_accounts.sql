-- Tabela de contas criadas pelo fluxo de sign-up.
-- O `id` e gerado com nanoid na camada de API.
-- O `password` guarda o hash do bcrypt (o salt ja vem embutido no hash).
create table if not exists public.accounts (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  password text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Um email so pode ser usado por uma conta (sem diferenciar maiusculas/minusculas).
create unique index if not exists accounts_email_key on public.accounts (lower(email));

-- Mantem `updated_at` atualizado em qualquer alteracao.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

-- Sem policies: a tabela fica inacessivel para as chaves publicas (anon/authenticated).
-- Apenas a API, usando a service role key, consegue ler e escrever.
alter table public.accounts enable row level security;
