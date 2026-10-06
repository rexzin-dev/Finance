-- ==============================================================================
-- FLUXO — GESTÃO FINANCEIRA PESSOAL
-- MIGRATION 002: ROW LEVEL SECURITY (RLS) & ESTRUTURAS DE PLANEJAMENTO E RESERVAS
-- ==============================================================================

-- 1. NOVAS TABELAS DE PLANEJAMENTO, RESERVAS E METAS
create table if not exists public.future_reserves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount >= 0),
  target_date date not null,
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  monthly_contribution numeric(14,2) not null default 0 check (monthly_contribution >= 0),
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reserve_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reserve_id uuid not null references public.future_reserves(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  source_account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date not null,
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'paused')),
  account_id uuid references public.accounts(id) on delete set null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- formato 'YYYY-MM'
  total_income numeric(14,2) not null default 0,
  total_expenses numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  savings_rate numeric(5,2) not null default 0,
  status text not null default 'positive' check (status in ('positive', 'negative', 'neutral')),
  closed_at timestamptz not null default now(),
  unique (user_id, month)
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) RIGOROSO
alter table public.future_reserves enable row level security;
alter table public.reserve_contributions enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.monthly_closings enable row level security;

-- Ajuste de política para perfis (auth.uid() = id)
drop policy if exists "user owns profiles" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 3. APLICAR POLÍTICAS INDIVIDUAIS COM SELECT / INSERT / UPDATE / DELETE PARA ISOLAMENTO TOTAL
-- future_reserves
create policy "future_reserves_all" on public.future_reserves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reserve_contributions
create policy "reserve_contributions_all" on public.reserve_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- financial_goals
create policy "financial_goals_all" on public.financial_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- goal_contributions
create policy "goal_contributions_all" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- monthly_closings
create policy "monthly_closings_all" on public.monthly_closings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. ÍNDICES DE PERFORMANCE E ISOLAMENTO MULTI-TENANT
create index if not exists idx_future_reserves_user on public.future_reserves(user_id);
create index if not exists idx_financial_goals_user on public.financial_goals(user_id);
create index if not exists idx_monthly_closings_user on public.monthly_closings(user_id, month);
