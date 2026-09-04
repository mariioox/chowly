-- =============================================================
-- CHOWLY - Migration 001: extend ORDERS for VAT, notes, timers
-- Non-destructive. Safe to run against an existing database in
-- Supabase -> SQL Editor -> New query -> Run.
-- =============================================================

alter table orders add column if not exists vat_amount numeric not null default 0;
alter table orders add column if not exists notes text;
alter table orders add column if not exists updated_at timestamptz default now();

update orders set updated_at = created_at where updated_at is null;