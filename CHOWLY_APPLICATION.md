# Chowly — Digital Dining Platform (Build)

**Author:** Okosun J. Ehimare
**Subject:** Foundation Software Engineering — Chowly Build Assignment
**Tech stack:** Next.js 16 (App Router, JavaScript) · Supabase (PostgreSQL) · Vercel

---

## 1. How it was built

### The stack
- **Next.js 16** with the App Router and React client components for the whole UI.
- **Supabase** (PostgreSQL) for real, persistent storage. No login is required, so the app talks to the database directly from the browser using the project's publishable key.
- Deployed on **Vercel**.
- Version control with **git**; the commit history shows the work as it was done.

### Structure
```
chowly/
  app/
    layout.js            # root layout, wraps everything in a toast provider
    page.js              # entry point — medallion-flip role switch + animated view transition
    globals.css          # all styling
  components/
    MedallionSwitch.js   # topbar coin that flips (3D) between Customer and Waiter
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
  .env.local             # holds the Supabase URL + publishable key (git-ignored)
```

### Data model as finally implemented
The original approved entity model (Restaurant, Customer, MenuItem, Waiter, Chef, Bartender, Order, OrderItem, Complaint, Payment) was carried over, with **two changes forced by the build**:

1. **Waiter, Chef and Bartender were merged into one `staff` table** with a `role` column. Requirement #3 says the waiter records the chef and bartender **from a staff list you loaded yourself** — one list is cleaner and still captures all three roles as foreign keys on the order. This also simplifies the seed data.
2. **`prep_time_mins` was added to `menu_items`.** Requirement #1 says each item carries a preparation time; the customer's waiting time is then shown as the maximum preparation time across the items in their order.

So the final tables are: `restaurants`, `customers`, `menu_items`, `staff`, `orders`, `order_items` (the M:M bridge), `complaints`, and `payments`. RLS is disabled on all tables because the assignment explicitly does not require logins — a simple role switch is enough, so switching roles is a single flip of a medallion-style control at the top right.

Mid-build polish added three columns to `orders` (`vat_amount`, `notes`, `updated_at`) plus a **5% VAT** rule: menu prices are including VAT, and the cart/confirmation/receipt break out **Subtotal (excl. VAT) → VAT (5%) → Total incl. VAT**. The order records the exact computed VAT amount so it can be shown again later. An **optional special-request note** is saved with each order (`notes`), a **prep timestamp** (`updated_at`) is stamped every time the status changes, and live prep deadlines are derived from it. Every query falls back to a computed value when a column is absent, so the app stays robust.

### How the application was deployed
1. The Next.js app is pushed to a **GitHub** repository.
2. The repo is imported into **Vercel** and deployed as a serverless Next.js project.
3. The two environment variables are set in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. The Supabase schema + seed were applied from `db/schema.sql` in the Supabase SQL Editor.
5. Deployment produces a live public URL.

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
- The explicit **pretend-payment label** the requirement asks for — the Pay button carries a
  "Pretend payment" caption and the receipt repeats it, so the payment is clearly labelled as
  pretend while still being fully recorded against the order.

**What was rejected:**
- A hosted authentication system (Supabase Auth with email/password and RLS policies) — over-engineered for this assignment since logins are not required; a simple role switch is used instead.

**What had to be corrected / verified by hand:**
- The npm registry on the machine was misconfigured (pointing to a slow mirror), which broke package installation — fixed by switching back to the official registry.
- The Next.js configuration warning about `package-lock.json` being outside the git root was checked and confirmed harmless.
- The schema cannot be applied to Supabase with only the publishable key (it is a client key), so table creation must be run in the Supabase SQL editor rather than assumed to work from code.

---

## 3. Behaviour of the application, step by step

The story runs exactly as in the assignment, from menu to payment. Two presentation notes: the customer side is styled as **light fine dining** (warm ivory, serif accents) while the **waiter side is a refined service pad** — same brand, but a distinctly operational, tablet-first layout. Motion (framer-motion) is used throughout: scroll reveals, the flipping role medallion, spring modals and an animated prep/status timeline.

### Switching roles
There is no login — the assignment explicitly says none is required. At the top right, a **medallion-style coin** shows the active role: **Guest** on one face and **Waiter** on the other. Clicking it spins it in 3D (framer-motion `rotateY` spring) and swaps the whole view beneath it in a cross-fade. One flip to go back and forth.

### Menu browsing
A customer on the Guest face is met by a compact **"Ordering as" bar** right under the header — a row of chips for the seeded customers (the active one is highlighted). Choosing a customer switches the whole session to them, and a small **"×"** appears in the corner of each chip on hover to **remove** a diner (customers who already have orders are protected and can't be removed). Two tabs sit above the content: **Restaurants** and **My Order**. Picking a **restaurant** opens its menu with **category pills** beneath the restaurant name — **All · Starters · Mains · Grills · Desserts · Beverages** — that filter the list; **22 items per restaurant** (3 Starters, 5 Mains, 5 Grills, 7 Beverages, 2 Desserts). Each item row shows its name, price, and preparation time. Customers are not limited to the seeded list — an **"+ Add"** chip in the ordering bar registers a new diner (name required, phone and email optional), saves them to the database and immediately makes them the active customer.

If no customer is selected when a restaurant is opened, Chowly picks the first seeded customer for you and says so with a toast. The basket belongs to the restaurant you are browsing — switching to a different restaurant clears it and tells you, while browsing the same restaurant again keeps your items so you can keep adding.

### Order placement
Tapping **Add** on items fills the basket, an **always-on order drawer** slides in from the right with a per-item summary, the running total and the estimated waiting time (the longest single-item prep time) — and a **count badge** appears on the **My Order** tab. You can keep adding items freely; the drawer stays visible so you always know your total (it becomes a bottom sheet on narrow screens). The full cart lives in the **My Order** tab: each line item, the **VAT breakdown** (Subtotal excl. VAT → VAT → Total incl. VAT), an optional **special request** field (saved with the order and shown to the waiter), and the waiting estimate. Tapping **Submit Order** creates the order in the database, flips you to the **My Order** tab and scrolls to the animated confirmation — order id, VAT breakdown, waiting time and total.

### Order assignment (waiter)
As soon as the customer submits, the order is **assigned to a waiter** — the system picks the
**least-busy waiter** at that restaurant and the confirmation card shows "Your waiter". The user flips
the medallion to **Waiter**. A **service queue** shows every incoming order, each stamped
**Assigned to: <waiter>**, with live counts (placed / in prep / overdue) and, once prep starts, a
**countdown to readiness**; orders that run past their deadline turn red and are counted as overdue.
Opening an order shows its items; the **waiter is already filled in** (still editable if needed) and
the waiter completes the order details by picking the **chef** and **bartender** from the staff
list, then taps **Start Prep**, which stamps the prep timestamp and moves the order to
`being_prepared`. Later the waiter taps **Mark as Served** to move it to `served`. The customer's
request note, if any, is surfaced on the card and in the modal.

### Complaint and rating
A **serious delay** is defined as an order that is `being_prepared` (prep has started) *and* whose
advertised waiting time has elapsed — the same deadline the waiter queue counts as overdue while the
customer's card shows **Est. ready ~HH:MM** and flips to **⚠ Delayed by ~X mins**. Only then does the
**Delayed? Complain & Rate** button appear. The customer picks a 1–5 star rating and writes a
complaint; both are stored against that order.

### Payment
When the order is `served`, the customer sees a **Pay** button with an explicit caption — **"Pretend payment — recorded for the demo"** (the requirement says the payment may be pretend but must be clearly labelled as such). Pressing it records a payment and marks the order as `paid`, then opens an elegant **receipt** with the itemised lines, the VAT breakdown, the paid stamp and the same pretend-payment note.

All of the above is saved in Supabase, so refreshing the page keeps every order, complaint and payment.

---

## 4. How to use it (walkthrough for a stranger)

1. Open the deployed link. You land on the **Customer** view (Guest face).
2. In the **"Ordering as"** bar, pick a customer (e.g. "Ade Johnson") — or just open a restaurant and Chowly picks one for you.
3. On the **Restaurants** tab, choose a restaurant, e.g. **The Lekki Grill**.
4. Use the **category pills** to filter (e.g. Grills) and add items, say Grilled Chicken and a Fresh Orange Juice. The **order drawer** slides in and the **My Order** tab gets a count badge. Open **My Order** for the cart, the VAT breakdown and the estimate; optionally add a special request.
5. Tap **Submit Order**. Note your order id, waiting time and the waiter auto-assigned to you.
6. Flip the **medallion** in the top bar to **Waiter**.
7. Your order is listed in the service queue as **Assigned to: <that waiter>**. Open it — the waiter
   is already selected — pick the chef and bartender, then **Start Prep** and watch the readiness
   countdown start.
8. Mark it **as Served**.
9. Flip the **medallion** back to **Guest**. Your order shows `served` on the animated timeline.
   (Had a serious delay happened — prep time elapsed while still `being_prepared` — the card flips to
   **⚠ Delayed by ~X mins** and **Delayed? Complain & Rate** appears. Quickest way: order a
   Coca-Cola, whose prep time is 2 minutes.)
10. Tap **Pay** (labelled "Pretend payment — recorded for the demo"). A receipt opens with the
    itemised lines and VAT breakdown; the order becomes `paid`.
11. Refresh the page — everything is still there, proving real persistence.

---

## Deliverables summary
- **Live URL:** https://chowly-two.vercel.app/
- **Git repository:** the codebase in this folder with commit history.
- **Document:** this file.
