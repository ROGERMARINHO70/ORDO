-- Ordo PC-BA — Schema completo com RLS
-- Execute no SQL Editor do Supabase (projeto limpo)

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type status_assunto as enum ('nao','andamento','dominado','critico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_disciplina as enum (
    'Não iniciada','Em andamento','Em revisão','Concluída'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type prioridade_tipo as enum ('Alta','Média','Baixa');
exception when duplicate_object then null; end $$;

-- ─── user_config ──────────────────────────────────────────────────────────────
create table if not exists user_config (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade unique,
  exam_name      text not null default 'Investigador PC-BA',
  exam_date      date not null default '2026-10-20',
  meta_diaria    integer not null default 180,
  dias_semana    integer not null default 6,
  theme          text not null default 'light',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── disciplinas ──────────────────────────────────────────────────────────────
create table if not exists disciplinas (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  peso           integer not null default 1 check (peso between 1 and 3),
  status         status_disciplina not null default 'Não iniciada',
  prioridade     prioridade_tipo not null default 'Média',
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── assuntos ─────────────────────────────────────────────────────────────────
create table if not exists assuntos (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  disciplina_id  uuid not null references disciplinas(id) on delete cascade,
  nome           text not null,
  status         status_assunto not null default 'nao',
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── questoes (sessões de questões) ──────────────────────────────────────────
create table if not exists questoes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  disciplina     text not null,
  total          integer not null check (total > 0),
  acertos        integer not null check (acertos >= 0),
  tempo_medio    numeric default 0,
  data           date not null default current_date,
  created_at     timestamptz not null default now()
);

-- ─── erros ────────────────────────────────────────────────────────────────────
create table if not exists erros (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  disciplina     text not null,
  assunto        text,
  tipo           text not null,
  banca          text,
  dificuldade    integer default 3 check (dificuldade between 1 and 5),
  tempo          integer,
  gabarito       text,
  justificativa  text,
  comentario     text,
  resolvido      boolean not null default false,
  data           date not null default current_date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── revisoes ─────────────────────────────────────────────────────────────────
create table if not exists revisoes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  origem         text not null,
  disciplina     text not null,
  assunto        text,
  etapa          integer not null default 0,
  criada_em      date not null default current_date,
  due_em         date not null,
  concluida      boolean not null default false,
  concluida_em   date,
  created_at     timestamptz not null default now()
);

-- ─── simulados ────────────────────────────────────────────────────────────────
create table if not exists simulados (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  data           date not null default current_date,
  total          integer not null,
  acertos        integer not null,
  por_disciplina jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ─── sessoes ──────────────────────────────────────────────────────────────────
create table if not exists sessoes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  disciplina     text not null,
  minutos        integer not null check (minutos > 0),
  data           date not null default current_date,
  created_at     timestamptz not null default now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
create index if not exists idx_disciplinas_user on disciplinas(user_id);
create index if not exists idx_assuntos_user on assuntos(user_id);
create index if not exists idx_assuntos_disc on assuntos(disciplina_id);
create index if not exists idx_questoes_user on questoes(user_id);
create index if not exists idx_erros_user on erros(user_id);
create index if not exists idx_revisoes_user on revisoes(user_id);
create index if not exists idx_revisoes_due on revisoes(user_id, due_em);
create index if not exists idx_simulados_user on simulados(user_id);
create index if not exists idx_sessoes_user on sessoes(user_id);
create index if not exists idx_sessoes_data on sessoes(user_id, data);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger trg_user_config_upd before update on user_config
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_disciplinas_upd before update on disciplinas
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_assuntos_upd before update on assuntos
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_erros_upd before update on erros
    for each row execute function update_updated_at();
exception when duplicate_object then null; end $$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table user_config  enable row level security;
alter table disciplinas   enable row level security;
alter table assuntos      enable row level security;
alter table questoes      enable row level security;
alter table erros         enable row level security;
alter table revisoes      enable row level security;
alter table simulados     enable row level security;
alter table sessoes       enable row level security;

-- user_config
create policy "own config" on user_config
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- disciplinas
create policy "own disciplinas" on disciplinas
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- assuntos
create policy "own assuntos" on assuntos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- questoes
create policy "own questoes" on questoes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- erros
create policy "own erros" on erros
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- revisoes
create policy "own revisoes" on revisoes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- simulados
create policy "own simulados" on simulados
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sessoes
create policy "own sessoes" on sessoes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
