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
    page.js              # entry point — holds the Customer/Waiter role switcher
    globals.css          # all styling
  components/
    CustomerView.js      # the customer side: menu, order, tracking, complaint, payment
    WaiterView.js        # the waiter side: queue, assignment, mark served
    Toast.js             # small toast/notification helper
  lib/
    supabase.js          # Supabase client
    data.js              # all database queries (placeOrder, submitComplaint, etc.)
  db/
    schema.sql           # the final schema + seed data (run in Supabase SQL Editor)
  .env.local             # holds the Supabase URL + publishable key (git-ignored)
```

### Data model as finally implemented
The original approved entity model (Restaurant, Customer, MenuItem, Waiter, Chef, Bartender, Order, OrderItem, Complaint, Payment) was carried over, with **two changes forced by the build**:

1. **Waiter, Chef and Bartender were merged into one `staff` table** with a `role` column. Requirement #3 says the waiter records the chef and bartender **from a staff list you loaded yourself** — one list is cleaner and still captures all three roles as foreign keys on the order. This also simplifies the seed data.
2. **`prep_time_mins` was added to `menu_items`.** Requirement #1 says each item carries a preparation time; the customer's waiting time is then shown as the maximum preparation time across the items in their order.

So the final tables are: `restaurants`, `customers`, `menu_items`, `staff`, `orders`, `order_items` (the M:M bridge), `complaints`, and `payments`. RLS is disabled on all tables because the assignment explicitly does not require logins — a simple role switch is enough.

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

**What was rejected:**
- A more complex multi-role login and permissions system — out of scope, since the assignment explicitly says logins are not required; a simple role switch is used instead.

**What had to be corrected / verified by hand:**
- The npm registry on the machine was misconfigured (pointing to a slow mirror), which broke package installation — fixed by switching back to the official registry.
- The Next.js configuration warning about `package-lock.json` being outside the git root was checked and confirmed harmless.
- The schema cannot be applied to Supabase with only the publishable key (it is a client key), so table creation must be run in the Supabase SQL editor rather than assumed to work from code.

---

## 3. Behaviour of the application, step by step

The story runs exactly as in the assignment, from menu to payment.

### Menu browsing
A customer opens the app, chooses **who they are** from the seeded customers (Step 1) and picks a **restaurant** (Step 2). The restaurant's menu loads split into **Food** and **Drinks**, each item showing its name, price, and preparation time.

### Order placement
The customer taps **Add** on items. A live order summary appears (the cart) with each line item, the running total, and the estimated waiting time (the longest single-item prep time). Tapping **Submit Order** creates the order, which is written to the database. The customer immediately sees a confirmation with their order id, the waiting time and the total.

### Order assignment (waiter)
The waiter switches role at the top bar. The waiter dashboard lists all incoming orders (status `placed` / `being_prepared`). Opening an order shows its items and lets the waiter pick the **waiter**, **chef** and **bartender** from the staff list, then taps **Assign & Start Prep**, which moves the order to `being_prepared`. Later the waiter taps **Mark as Served** to move it to `served`.

### Complaint and rating
Back in the customer view, the customer sees their orders with live status (auto-refreshing). If an order is `being_prepared` (i.e. delayed), the customer can press **Delayed? Complain & Rate**, pick a 1–5 star rating and write a complaint. Both are stored against that order.

### Payment
When the order is `served`, the customer sees a **Pay — PRETEND** button. Pressing it records a payment (clearly labelled **Pretend** in code and UI, method = "Pretend") and marks the order as `paid` — the last step before the customer exits.

All of the above is saved in Supabase, so refreshing the page keeps every order, complaint and payment.

---

## 4. How to use it (walkthrough for a stranger)

1. Open the deployed link. You land on the **Customer** view.
2. **Step 1** — pick a customer (e.g. "Ade Johnson").
3. **Step 2** — choose a restaurant, e.g. **Chowly Grill**.
4. Add some items — bread and a drink. Watch your cart, total and estimate update.
5. Tap **Submit Order**. Note your order id and waiting time.
6. Switch to the **Waiter** role using the toggle at the top right.
7. Your order is listed. Open it, assign a waiter, chef and bartender, then **Assign & Start Prep**.
8. Mark it **as Served**.
9. Switch back to **Customer**. Your order shows `served`. (If it were `being_prepared`, you could complain and rate.)
10. Tap **Pay — PRETEND**. The order becomes `paid`.
11. Refresh the page — everything is still there, proving real persistence.

---

## Deliverables summary
- **Live URL:** *set after deployment*
- **Git repository:** the codebase in this folder with commit history.
- **Document:** this file.
