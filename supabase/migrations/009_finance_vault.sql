-- ─── Finance Vault — Database Schema ──────────────────────────────────────
-- Run this in your Supabase SQL editor

-- 1. Vault settings (PIN hash, per user)
create table if not exists public.vault_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  pin_hash     text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id)
);

-- 2. Monthly budgets
create table if not exists public.finance_months (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  year           int not null,
  month          int not null,   -- 1–12
  income_amount  numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  unique(user_id, year, month)
);

-- 3. Expense records
create table if not exists public.finance_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  month_id     uuid references public.finance_months(id) on delete cascade,
  amount       numeric(12,2) not null,
  category     text not null,
  description  text,
  spent_at     timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- 4. Debt ledger
create table if not exists public.finance_debts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  person_name  text not null,
  amount       numeric(12,2) not null,
  purpose      text not null,
  type         text not null check (type in ('gave', 'received')),
  is_settled   boolean not null default false,
  transacted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- 5. Share tokens for debt summaries
create table if not exists public.debt_share_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  person_name  text not null,
  token        text not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '30 days')
);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.vault_settings       enable row level security;
alter table public.finance_months       enable row level security;
alter table public.finance_expenses     enable row level security;
alter table public.finance_debts        enable row level security;
alter table public.debt_share_tokens    enable row level security;

-- vault_settings: only owner
create policy "vault_settings owner only" on public.vault_settings
  for all using (auth.uid() = user_id);

-- finance_months: only owner
create policy "finance_months owner only" on public.finance_months
  for all using (auth.uid() = user_id);

-- finance_expenses: only owner
create policy "finance_expenses owner only" on public.finance_expenses
  for all using (auth.uid() = user_id);

-- finance_debts: only owner
create policy "finance_debts owner only" on public.finance_debts
  for all using (auth.uid() = user_id);

-- debt_share_tokens: owner can read/write; anyone can read (for public share page)
create policy "debt_share_tokens owner rw" on public.debt_share_tokens
  for all using (auth.uid() = user_id);

create policy "debt_share_tokens public read" on public.debt_share_tokens
  for select using (true);

-- Public SELECT on finance_debts via share token is handled server-side via service role key.

-- ─── Indexes ───────────────────────────────────────────────────────────────
create index idx_finance_expenses_user_month on public.finance_expenses(user_id, month_id);
create index idx_finance_expenses_spent_at on public.finance_expenses(spent_at desc);
create index idx_finance_debts_user_person on public.finance_debts(user_id, person_name);
create index idx_debt_share_tokens_token on public.debt_share_tokens(token);
