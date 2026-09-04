# Chowly — Digital Dining Platform

A fine-dining dining-room app where a customer browses a restaurant's menu, places an order, waits,
complains/rates when delayed, and pays — while a waiter manages the kitchen queue and assigns staff.

**Live app:** https://chowly-two.vercel.app/
**Repository:** https://github.com/mariioox/chowly

## Features

- Customer menu with per-item price and preparation time
- Order placement with live waiting-time, VAT breakdown and optional special requests
- Waiter service queue: assign waiter/chef/bartender, live prep countdowns, mark served
- Complaint & rating stored against an order
- Pretend payment (clearly labelled) with a paid receipt
- Real persistence — Supabase/Postgres, everything survives a refresh
- Customer / Waiter role switch with animated transitions (no login required)

## Stack

Next.js 16 (App Router, React 19) · Supabase (PostgreSQL) · Framer Motion · deployed on Vercel

## Local development

1. **Install:** `npm install`
2. **Env:** create `.env.local` with your Supabase project keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
3. **Database:** run `db/schema.sql` (fresh setup) or `db/reseed.sql` (reset everything) in the
   Supabase SQL Editor.
4. **Run:** `npm run dev` → http://localhost:3000

## Deployment

Deploy the repo on Vercel and set the same two environment variables. The app is fully static at the
edge and talks to Supabase straight from the browser.

## Assignment deliverables

See `CHOWLY_APPLICATION.md` for the full build document (how it was built, AI usage, behaviour
walkthrough) that accompanies this submission.