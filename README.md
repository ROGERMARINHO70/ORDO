# Ordo — Preparação PC-BA 2026

Aplicativo full-stack de gestão de estudos para concursos, com ciclo adaptativo, SRS, readiness score e timeline de 14 semanas.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS v4** + **shadcn/ui**
- **TanStack React Query** (cache + optimistic updates)
- **@dnd-kit** (Kanban drag-and-drop)

## Funcionalidades

| Página | Descrição |
|---|---|
| **Hoje** | Dashboard com readiness score, ciclo adaptativo, revisões pendentes, KPIs |
| **Assistente** | Briefing diário com alertas + plano semanal gerado automaticamente |
| **Timeline** | 14 semanas ancoradas no dia da prova, milestones, horas plan/exec |
| **Ciclo** | Fila adaptativa de disciplinas por peso × fraqueza × revisões atrasadas |
| **Disciplinas** | Tabela + Kanban com dnd-kit, Peek com estatísticas |
| **Assuntos** | Tabela com inline status (agenda SRS ao marcar "dominado") |
| **Questões** | Registro de sessões, KPIs, gráfico de taxa por disciplina |
| **Simulados** | Histórico de simulados, gráfico de evolução |
| **Revisões** | Tabela + Calendário, criar série SRS manual |
| **Caderno** | Registro de erros com SRS automático, ranking de fraquezas, padrões por tipo |

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Banco de dados Supabase

No painel do Supabase → **SQL Editor**, execute em ordem:

1. `supabase/schema.sql` — cria tabelas, enums, índices, triggers, RLS
2. `supabase/seed_edital.sql` — cria a função `seed_edital()` (chamada automaticamente no primeiro login via OAuth callback)

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Deploy (Vercel)

1. Faça push do repositório para o GitHub
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório
3. Configure as environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Após o deploy, copie a URL de produção (ex: `https://ordo.vercel.app`)
5. No painel Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://ordo.vercel.app`
   - **Redirect URLs**: adicione `https://ordo.vercel.app/auth/callback`

## Estrutura

```
app/
  (auth)/login/        # Página de login/signup
  (app)/               # Layout autenticado com AppShell
    hoje/              # Dashboard principal
    assistente/        # Briefing + plano semanal
    timeline/          # 14 semanas
    ciclo/             # Fila adaptativa
    disciplinas/       # Kanban + Tabela
    assuntos/          # Tabela com SRS inline
    questoes/          # Registro de sessões
    simulados/         # Histórico de simulados
    revisoes/          # Tabela + Calendário
    caderno/           # Caderno de erros
  auth/callback/       # Handler OAuth

components/
  AppShell.tsx         # Layout + sidebar + topbar
  CommandPalette.tsx   # ⌘K navegação global
  ThemeProvider.tsx    # Dark/light mode
  Ring.tsx             # SVG readiness ring
  Tag.tsx / Progress.tsx / Peek.tsx / EmptyState.tsx

hooks/                 # React Query hooks para cada entidade
lib/domain/            # Lógica pura: stats, ciclo, srs, readiness, intel, weeks14
supabase/
  schema.sql           # DDL completo
  seed_edital.sql      # Seed com 14 disciplinas PC-BA
```
