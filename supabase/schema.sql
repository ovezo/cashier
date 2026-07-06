-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
--
-- Cashier syncs its whole local app state (accounts, categories, transactions,
-- debts, recurringRules) as a single JSON blob per signed-in user, rather than
-- a normalized per-table schema — this is a single-user app viewed across
-- devices, not multi-editor collaboration, so there's nothing to gain from
-- splitting it up.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "select own row" on public.user_data
  for select using (auth.uid() = user_id);

create policy "insert own row" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "update own row" on public.user_data
  for update using (auth.uid() = user_id);
