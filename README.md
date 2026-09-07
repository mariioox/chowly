# Chowly — Digital Dining Platform

A fine-dining dining-room app where a customer browses a restaurant's menu, places an order, waits,
complains/rates when delayed, and pays — while the least-busy waiter is auto-assigned and runs the
kitchen queue, starting prep and marking orders served.

**Live app:** https://chowly-two.vercel.app/
**Repository:** https://github.com/mariioox/chowly

## Features

- Medallion-flip switch to act as Customer or Waiter — no logins, just roles
- Customer picker ("who is ordering") with a menu showing price and prep time per item
- Order placement: auto-assigned to the least-busy waiter, live waiting-time, VAT breakdown and optional special requests
- Waiter service queue: waiter pre-filled, pick chef/bartender, prep countdowns, mark served
- Complaint & rating gated on a serious delay (prep time elapsed while still preparing)
- Payment clearly labelled as pretend — recorded as a payment, marked paid, with a printable receipt
- Real persistence — Supabase/Postgres, everything survives a refresh

## Stack

Next.js 16 (App Router, React 19) · Supabase (PostgreSQL) · Framer Motion · deployed on Vercel

## Local development

1. **Install:** `npm install`
2. **Env:** create `.env.local` with your Supabase project keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
3. **Database:** run `db/schema.sql` in the Supabase SQL Editor (creates the tables and seeds the data).
4. **Run:** `npm run dev` → http://localhost:3000

## Deployment

Deploy the repo on Vercel and set the same two environment variables. The app is fully static at the
edge and talks to Supabase straight from the browser.

## Assignment deliverables

See `CHOWLY_APPLICATION.md` for the full build document (how it was built, AI usage, behaviour
walkthrough) that accompanies this submission.