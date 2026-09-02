-- Disable Row Level Security on all Chowly tables
-- Run this in Supabase -> SQL Editor -> New query -> Run.
-- The app uses the publishable (anon) key with no login, so RLS must be off
-- for customers and waiters to read/write the database.
alter table public.restaurants disable row level security;
alter table public.customers   disable row level security;
alter table public.menu_items  disable row level security;
alter table public.staff       disable row level security;
alter table public.orders      disable row level security;
alter table public.order_items disable row level security;
alter table public.complaints  disable row level security;
alter table public.payments    disable row level security;
