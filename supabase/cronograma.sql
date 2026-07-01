-- Etapa 2 do plano139 — execute no SQL Editor do Supabase após schema.sql

create table if not exists cronograma_status (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  dia        integer not null,           -- número do dia 1–139
  bloco      text not null,              -- ex: 'BLOCO #1', 'REV. SEMANAL'
  status     text not null default 'feito',
  feito_em   timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dia, bloco)
);

create index if not exists idx_cronograma_status_user on cronograma_status(user_id);

alter table cronograma_status enable row level security;

create policy "own cronograma_status" on cronograma_status
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
