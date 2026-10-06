-- ==============================================================================
-- FLUXO — GESTÃO FINANCEIRA PESSOAL
-- MIGRATION CONSOLIDADA DE PRODUÇÃO (001_initial_schema.sql)
-- Supabase Cloud PostgreSQL + Supabase Auth
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
create extension if not exists pgcrypto;

-- 2. TIPOS E ENUMS
do $$ begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('income', 'expense', 'transfer');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type public.transaction_status as enum ('pending', 'paid', 'overdue', 'received', 'to_receive', 'in_invoice', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type public.account_type as enum ('checking', 'savings', 'cash', 'digital_wallet', 'investment', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('open', 'closed', 'paid', 'overdue');
  end if;
end $$;

-- 3. PERFIS DE USUÁRIOS (Vinculado a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. CONTAS BANCÁRIAS E CARTEIRAS
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  type public.account_type not null default 'checking',
  opening_balance numeric(14,2) not null default 0,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. CATEGORIAS DE LANÇAMENTOS
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  kind public.transaction_type,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- 6. CARTÕES DE CRÉDITO
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  bank_code text,
  card_brand text,
  card_last_digits text,
  credit_limit numeric(14,2) not null check (credit_limit >= 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color text,
  custom_color text,
  use_auto_color boolean default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. FATURAS DE CARTÃO DE CRÉDITO
create table if not exists public.credit_card_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  reference_month text not null, -- 'YYYY-MM'
  due_date date not null,
  closing_date date not null,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status public.invoice_status not null default 'open',
  paid_at timestamptz,
  payment_account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(credit_card_id, reference_month)
);

-- 8. COMPRAS NO CARTÃO DE CRÉDITO (LANÇAMENTO PRINCIPAL)
create table if not exists public.credit_card_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  purchase_date date not null default current_date,
  total_amount numeric(14,2) not null check (total_amount > 0),
  payment_type text not null check (payment_type in ('cash', 'installment')),
  installments_count smallint not null default 1 check (installments_count > 0),
  notes text,
  created_at timestamptz not null default now()
);

-- 9. PARCELAS DE CARTÃO DE CRÉDITO
create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.credit_card_purchases(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  installment_number smallint not null,
  total_installments smallint not null,
  amount numeric(14,2) not null check (amount > 0),
  competence_month text not null, -- 'YYYY-MM'
  due_date date not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid')),
  invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(purchase_id, installment_number)
);

-- 10. TRANSAÇÕES / LANÇAMENTOS GERAIS
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  type public.transaction_type not null,
  status public.transaction_status not null default 'pending',
  transaction_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  account_id uuid references public.accounts(id) on delete set null,
  destination_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  payment_method text,
  is_recurring boolean default false,
  recurring_transaction_id uuid,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  purchase_id uuid references public.credit_card_purchases(id) on delete set null,
  installment_number smallint,
  total_installments smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type <> 'transfer') or (account_id is not null and destination_account_id is not null and account_id <> destination_account_id))
);

-- 11. TRANSAÇÕES RECORRENTES
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  type public.transaction_type not null,
  frequency text not null check(frequency in ('weekly','monthly','yearly','custom')),
  next_run date not null,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  payment_method text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 12. EMPRÉSTIMOS E CONTRATOS
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lender text,
  contracted_amount numeric(14,2) not null check (contracted_amount > 0),
  remaining_amount numeric(14,2) not null check (remaining_amount >= 0),
  total_installments smallint not null check (total_installments > 0),
  paid_installments smallint not null default 0 check (paid_installments >= 0),
  installment_value numeric(14,2) not null check (installment_value > 0),
  next_due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. RESERVAS FINANCEIRAS E DESPESAS FUTURAS
create table if not exists public.future_reserves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  target_amount numeric(14,2) not null check (target_amount >= 0),
  target_date date not null,
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. APORTES E RESGATES EM RESERVAS
create table if not exists public.reserve_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reserve_id uuid not null references public.future_reserves(id) on delete cascade,
  amount numeric(14,2) not null, -- positivo aporte, negativo resgate
  date date not null default current_date,
  from_account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 15. ORÇAMENTOS POR CATEGORIA (BUDGETS)
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  month_key text, -- 'YYYY-MM' ou null para recorrente padrão
  is_recurring boolean not null default true,
  created_at timestamptz not null default now()
);

-- 16. METAS FINANCEIRAS
create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. CONTRIBUIÇÕES PARA METAS
create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw')),
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  from_account_id uuid references public.accounts(id) on delete set null,
  to_account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 18. FECHAMENTOS MENSAIS E HISTÓRICO
create table if not exists public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null, -- 'YYYY-MM'
  status text not null default 'open' check (status in ('open', 'closed')),
  opening_balance numeric(14,2) not null default 0,
  income_total numeric(14,2) not null default 0,
  expense_total numeric(14,2) not null default 0,
  pending_expenses numeric(14,2) not null default 0,
  credit_card_total numeric(14,2) not null default 0,
  pending_invoices numeric(14,2) not null default 0,
  committed_total numeric(14,2) not null default 0,
  closing_balance numeric(14,2) not null default 0,
  result numeric(14,2) not null default 0,
  closed_at timestamptz,
  closed_by text,
  history jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);

-- 19. AUDITORIA ADMINISTRATIVA
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id text not null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 20. ÍNDICES DE PERFORMANCE E MULTI-TENANCY
-- ==============================================================================
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_credit_cards_user on public.credit_cards(user_id);
create index if not exists idx_invoices_card_month on public.credit_card_invoices(credit_card_id, reference_month);
create index if not exists idx_purchases_user on public.credit_card_purchases(user_id);
create index if not exists idx_installments_user on public.installments(user_id);
create index if not exists idx_installments_month on public.installments(competence_month);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_user_status on public.transactions(user_id, status);
create index if not exists idx_loans_user on public.loans(user_id);
create index if not exists idx_future_reserves_user on public.future_reserves(user_id);
create index if not exists idx_budgets_user on public.budgets(user_id);
create index if not exists idx_goals_user on public.financial_goals(user_id);
create index if not exists idx_monthly_closings_user on public.monthly_closings(user_id, month_key);
create index if not exists idx_admin_audit_logs_actor on public.admin_audit_logs(actor_user_id);

-- ==============================================================================
-- 21. ROW LEVEL SECURITY (RLS) RIGOROSO EM TODAS AS TABELAS
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.credit_card_invoices enable row level security;
alter table public.credit_card_purchases enable row level security;
alter table public.installments enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.loans enable row level security;
alter table public.future_reserves enable row level security;
alter table public.reserve_contributions enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.monthly_closings enable row level security;
alter table public.admin_audit_logs enable row level security;

-- POLÍTICAS PARA PROFILES (auth.uid() = id)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- POLÍTICAS GENÉRICAS PARA TODAS AS TABELAS COM user_id
do $$
declare
  tbl text;
  tables text[] := array[
    'accounts',
    'categories',
    'credit_cards',
    'credit_card_invoices',
    'credit_card_purchases',
    'installments',
    'transactions',
    'recurring_transactions',
    'loans',
    'future_reserves',
    'reserve_contributions',
    'budgets',
    'financial_goals',
    'goal_contributions',
    'monthly_closings'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "%1$s_all" on public.%1$I', tbl);
    execute format('create policy "%1$s_all" on public.%1$I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', tbl);
  end loop;
end $$;

-- POLÍTICA DE AUDITORIA ADMINISTRATIVA (Apenas admin lê; backend autenticado insere)
drop policy if exists "admin_audit_logs_select" on public.admin_audit_logs;
create policy "admin_audit_logs_select" on public.admin_audit_logs
  for select
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

drop policy if exists "admin_audit_logs_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_insert" on public.admin_audit_logs
  for insert
  with check (
    auth.uid() = actor_user_id
  );

-- ==============================================================================
-- 22. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL E CATEGORIAS BÁSICAS
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Criar perfil
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  -- 2. Categorias padrão essenciais para início rápido e sem erros
  insert into public.categories (user_id, name, kind, color, icon)
  values
    (new.id, 'Salário', 'income', '#16a34a', 'Wallet'),
    (new.id, 'Rendimentos', 'income', '#0d9488', 'TrendingUp'),
    (new.id, 'Alimentação', 'expense', '#ea580c', 'Utensils'),
    (new.id, 'Moradia', 'expense', '#2563eb', 'Home'),
    (new.id, 'Transporte', 'expense', '#7c3aed', 'Car'),
    (new.id, 'Saúde', 'expense', '#e11d48', 'HeartPulse'),
    (new.id, 'Lazer', 'expense', '#0284c7', 'Smile'),
    (new.id, 'Educação', 'expense', '#4f46e5', 'GraduationCap'),
    (new.id, 'Outros', 'expense', '#64748b', 'Tag')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
