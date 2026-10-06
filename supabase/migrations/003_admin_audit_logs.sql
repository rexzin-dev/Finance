-- ==============================================================================
-- FLUXO — GESTÃO FINANCEIRA PESSOAL
-- MIGRATION 003: AUDITORIA ADMINISTRATIVA & POLÍTICAS DE PERMISSÕES
-- ==============================================================================

-- 1. TABELA DE AUDITORIA ADMINISTRATIVA
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id text not null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Ativar Row Level Security na tabela de auditoria
alter table public.admin_audit_logs enable row level security;

-- Apenas Administradores podem consultar os logs de auditoria
create policy "admin_audit_logs_select" on public.admin_audit_logs
  for select
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- Inserção de auditoria feita apenas pelo backend autenticado
create policy "admin_audit_logs_insert" on public.admin_audit_logs
  for insert
  with check (
    auth.uid() = actor_user_id
  );

-- Índice para busca rápida de auditoria
create index if not exists idx_admin_audit_logs_actor on public.admin_audit_logs(actor_user_id);
create index if not exists idx_admin_audit_logs_created on public.admin_audit_logs(created_at desc);
