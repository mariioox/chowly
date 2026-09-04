# Chowly — Digital Dining Platform (Build)

**Author:** Okosun J. Ehimare
**Subject:** Foundation Software Engineering — Chowly Build Assignment
**Tech stack:** Next.js 16 (App Router, JavaScript) · Supabase (PostgreSQL) · Vercel

---

## 1. How it was built

### The stack
- **Next.js 16** with the App Router and React client components for the whole UI.
- **Supabase** (PostgreSQL) for real, persistent storage. No login is required, so the app talks to the database directly from the browser using the project's keys.
- Deployed on **Vercel**.
- Version control with **git**; the commit history shows the work as it was done.

### Structure
```
chowly/
  app/
    layout.js            # root layout, wraps everything in a toast provider
    page.js              # entry point — role switcher with animated pill + view transition
    globals.css          # all styling
  components/
    CustomerView.js      # the customer side: menu, order, tracking, timeline, complaint, payment, receipt
    WaiterView.js        # the waiter side: queue, assignment, prep timers, mark served
    OrderTimeline.js     # animated 4-step customer prep/outcome timeline
    Reveal.js            # scroll-reveal wrapper (fine-dining easing)
    Toast.js             # animated toast/notification helper
  lib/
    supabase.js          # Supabase client
    data.js              # all database queries (placeOrder, submitComplaint, etc.)
    format.js            # money formatting, short order ids, VAT helper (splitVat)
  db/
    schema.sql           # the final schema + seed data (run in Supabase SQL Editor)
    migrations/001_extend_orders.sql  # non-destructive ALTER adding vat_amount, notes, updated_at to orders
  .env.local             # holds the Supabase URL + publishable key (git-ignored)
```

### Data model as finally implemented
The original approved entity model (Restaurant, Customer, MenuItem, Waiter, Chef, Bartender, Order, OrderItem, Complaint, Payment) was carried over, with **two changes forced by the build**:

1. **Waiter, Chef and Bartender were merged into one `staff` table** with a `role` column. Requirement #3 says the waiter records the chef and bartender **from a staff list you loaded yourself** — one list is cleaner and still captures all three roles as foreign keys on the order. This also simplifies the seed data.
2. **`prep_time_mins` was added to `menu_items`.** Requirement #1 says each item carries a preparation time; the customer's waiting time is then shown as the maximum preparation time across the items in their order.

So the final tables are: `restaurants`, `customers`, `menu_items`, `staff`, `orders`, `order_items` (the M:M bridge), `complaints`, and `payments`. RLS is disabled on all tables because the assignment explicitly does not require logins — a simple role switch is enough.

Mid-build polish added three columns to `orders` (`vat_amount`, `notes`, `updated_at`) plus a **5% VAT** rule: menu prices are including VAT, and the cart/confirmation/receipt break out **Subtotal (excl. VAT) → VAT (5%) → Total incl. VAT**. The order records the exact computed VAT amount so it can be shown again later. An **optional special-request note** is saved with each order (`notes`), a **prep timestamp** (`updated_at`) is stamped every time the status changes, and live prep deadlines are derived from it. Unordered columns always fall back to a computed value, so the app still works on a database that has not been migrated yet.

### How the application was deployed
1. The Next.js app is pushed to a **GitHub** repository.
2. The repo is imported into **Vercel** and deployed as a serverless Next.js project.
3. The two environment variables are set in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. The Supabase schema + seed were applied from `db/schema.sql` in the Supabase SQL Editor.
5. On deployed databases created before the polish phase, run `db/migrations/001_extend_orders.sql` in the Supabase SQL Editor once — it adds the `vat_amount`, `notes` and `updated_at` columns non-destructively.
6. Deployment produces a live public URL.

---

## 2. How AI was used

AI was used as a pair-programming tool throughout the build.

**Tools:** the AI was given the assignment brief (extracted from `chowly_lab.pdf`), the previously submitted entity model (`Chowly_Entity_Model_Ehimare_Okosun.pdf`), and the Supabase connection details.

**What it was asked to do:**
- Re-read the assignment requirement list and turn it into a concrete feature-by-feature plan.
- Produce an adapted SQL schema from the approved entity model and explain the changes.
- Scaffold the Next.js app and generate the React components and all the Supabase queries.

**What was accepted:**
- The overall data model and the decision to merge the three staff roles into one `staff` table.
- The generated schema, styling, and the customer/waiter component structure.

**What was rejected:**
- A more complex multi-role login and permissions system — out of scope, since the assignment explicitly says logins are not required; a simple role switch is used instead.

**What had to be corrected / verified by hand:**
- The npm registry on the machine was misconfigured (pointing to a slow mirror), which broke package installation — fixed by switching back to the official registry.
- The Next.js configuration warning about `package-lock.json` being outside the git root was checked and confirmed harmless.
- The schema cannot be applied to Supabase with only the publishable key (it is a client key), so table creation must be run in the Supabase SQL editor rather than assumed to work from code.

---

## 3. Behaviour of the application, step by step

The story runs exactly as in the assignment, from menu to payment. Two presentation notes: the customer side is styled as **light fine dining** (warm ivory, serif accents) while the **waiter side is a refined service pad** — same brand, but a distinctly operational, tablet-first layout. Motion (framer-motion) is used throughout: scroll reveals, an animated role pill with cross-view transitions, spring modals and an animated prep/status timeline.

### Menu browsing
A customer opens the app, chooses **who they are** from the seeded customers (Step 1) and picks a **restaurant** (Step 2). The restaurant's menu loads split into **Food** and **Drinks**, each item showing its name, price, and preparation time.

### Order placement
The customer taps **Add** on items. A live order summary appears (the cart) with each line item, the running total, and the estimated waiting time (the longest single-item prep time), plus the full **VAT breakdown** (Subtotal excl. VAT → VAT → Total incl. VAT). An optional **special request** field lets the customer note allergies or preferences, which is saved with the order and shown to the waiter. Tapping **Submit Order** creates the order, which is written to the database. The customer immediately sees an animated confirmation with their order id, the VAT breakdown, the waiting time and the total.

### Order assignment (waiter)
The waiter switches role at the top bar. A **service queue** shows every incoming order with live counts (placed / in prep / overdue) and, once prep starts, a **countdown to readiness**; orders that run past their deadline turn red and are counted as overdue. Opening an order shows its items and lets the waiter pick the **waiter**, **chef** and **bartender** from the staff list, then taps **Assign & Start Prep**, which stamps the prep timestamp and moves the order to `being_prepared`. Later the waiter taps **Mark as Served** to move it to `served`. The customer's request note, if any, is surfaced on the card and in the modal.

### Complaint and rating
Back in the customer view, the customer sees their orders with a live **animated status timeline** (auto-refreshing). If an order is `being_prepared` (i.e. delayed), the customer can press **Delayed? Complain & Rate**, pick a 1–5 star rating and write a complaint. Both are stored against that order.

### Payment
When the order is `served`, the customer sees a **Pay — PRETEND** button. Pressing it records a payment (clearly labelled **Pretend** in code and UI, method = "Pretend") and marks the order as `paid`, then opens an elegant **receipt** with the itemised lines, the VAT breakdown and the paid stamp.

All of the above is saved in Supabase, so refreshing the page keeps every order, complaint and payment.

---

## 4. How to use it (walkthrough for a stranger)

1. Open the deployed link. You land on the **Customer** view.
2. **Step 1** — pick a customer (e.g. "Ade Johnson").
3. **Step 2** — choose a restaurant, e.g. **Chowly Grill**.
4. Add some items — e.g. Grilled Chicken and a Fresh Orange Juice. Watch your cart, the VAT breakdown and the estimate update. Optionally add a special request.
5. Tap **Submit Order**. Note your order id and waiting time.
6. Switch to the **Waiter** role using the toggle at the top right.
7. Your order is listed in the service queue. Open it, assign a waiter, chef and bartender, then **Assign & Start Prep** — watch its readiness countdown start.
8. Mark it **as Served**.
9. Switch back to **Customer**. Your order shows `served` on the animated timeline. (If it were `being_prepared`, you could complain and rate.)
10. Tap **Pay — PRETEND**. A receipt opens with the itemised lines and VAT breakdown; the order becomes `paid`.
11. Refresh the page — everything is still there, proving real persistence.

---

## Deliverables summary
- **Live URL:** https://chowly-two.vercel.app/
- **Git repository:** the codebase in this folder with commit history.
- **Document:** this file.
