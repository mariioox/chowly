-- =============================================================
-- CHOWLY - Production schema + seed (Supabase / Postgres SQL Editor)
-- Run this whole file in Supabase -> SQL Editor -> New query -> Run.
--
-- Adapted from the approved Entity Model with these changes (from the docs):
--   1. Waiter, Chef, Bartender merged into ONE `staff` table with a `role`
--      column. Req #3 wants "a staff list you loaded yourself" - one list
--      is cleaner and still captures the three responsibilities.
--   2. `prep_time_mins` added to menu_items so the customer's waiting time
--      can be computed (Req #1 stores a preparation time).
--   3. `status` on orders drives the whole story:
--      placed -> being_prepared -> served -> paid.
-- =============================================================

-- Drop in dependency-safe order (safe to re-run)
drop table if exists payments;
drop table if exists complaints;
drop table if exists order_items;
drop table if exists orders;
drop table if exists staff;
drop table if exists customers;
drop table if exists menu_items;
drop table if exists restaurants;

-- 1. RESTAURANT
create table restaurants (
  id          text primary key,
  name        text not null,
  address     text not null,
  phone       text,
  image_url   text
);

-- 2. CUSTOMER
create table customers (
  id          text primary key,
  name        text not null,
  phone       text,
  email       text
);

-- 3. MENU_ITEM
create table menu_items (
  id             text primary key,
  restaurant_id  text not null references restaurants(id),
  name           text not null,
  description    text,
  item_type      text not null check (item_type in ('Food','Drink')),
  price          numeric not null default 0,
  prep_time_mins integer not null default 0,
  image_url      text
);

-- 4. STAFF (was Waiter + Chef + Bartender)
create table staff (
  id             text primary key,
  restaurant_id  text not null references restaurants(id),
  name           text not null,
  role           text not null check (role in ('Waiter','Chef','Bartender')),
  phone          text
);

-- 5. ORDER
create table orders (
  id              text primary key,
  customer_id     text not null references customers(id),
  restaurant_id   text not null references restaurants(id),
  waiter_id       text references staff(id),
  chef_id         text references staff(id),
  bartender_id    text references staff(id),
  status          text not null default 'placed'
                    check (status in ('placed','being_prepared','served','paid')),
  waiting_time    integer,
  total_amount    numeric not null default 0,
  vat_amount      numeric not null default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 6. ORDER_ITEM (M:M bridge Order <-> MenuItem)
create table order_items (
  id            text primary key,
  order_id      text not null references orders(id),
  menu_item_id  text not null references menu_items(id),
  quantity      integer not null default 1,
  subtotal      numeric not null default 0
);

-- 7. COMPLAINT
create table complaints (
  id          text primary key,
  order_id    text not null references orders(id),
  customer_id text not null references customers(id),
  description text,
  rating      integer check (rating between 1 and 5),
  submitted_at timestamptz default now()
);

-- 8. PAYMENT
create table payments (
  id            text primary key,
  order_id      text not null references orders(id),
  amount        numeric not null,
  method        text not null default 'Pretend',
  status        text not null default 'Completed',
  paid_at       timestamptz default now()
);

-- ---------- SEED DATA ----------
-- Restaurants
insert into restaurants values
 ('R001','Chowly Grill','12 Admiralty Way, Lekki','08012345678','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=720&fit=crop'),
 ('R002','Terra Kulture Restaurant','1 Tiamiyu Savage, VI','08023456789','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=720&fit=crop');

-- Customers
insert into customers values
 ('C001','Ade Johnson','08011122233','ade.johnson@email.com'),
 ('C002','Amaka Obi','08022233344','amaka.obi@email.com'),
 ('C003','Tunde Bakare','08033344455','tunde.bakare@email.com');

-- Menu (fine-dining Nigerian menu, refined names + descriptions)
insert into menu_items (id,restaurant_id,name,description,item_type,price,prep_time_mins,image_url) values
 ('M001','R001','Charred Suya Chicken','Fire-grilled chicken, house suya spice, charred citrus, smoked scotch bonnet oil','Food',18500,20,'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop'),
 ('M002','R001','House Chapman','Citrus-hibiscus aperitif, angostura bitters, toasted clove, candied ginger','Drink',6500,5,'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop'),
 ('M003','R001','Uziza Pepper Broth','Slow-simmered goat consommé, uziza leaf, aromatic spices, palm-oil emulsion','Food',22000,25,'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop'),
 ('M004','R001','Zobo Tonic','Hibiscus-cooled infusion, ginger, star anise, lightly sweetened','Drink',4500,3,'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop'),
 ('M005','R002','Smoked Jollof Basmati','One-pot smoked rice, farm tomatoes, scotch bonnet, grilled prawn, burnt lemon','Food',16500,15,'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop'),
 ('M006','R002','Ofada Rice & Assorted','Ancestral unpolished rice, assorted pepper suya, aged palm-oil stew, plantain crisp','Food',21000,20,'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=400&fit=crop'),
 ('M007','R002','Signature Chapman','House bitter base, fresh citrus, infusions of the day, smoked demerara rim','Drink',6800,5,'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop'),
 ('M008','R002','Fresh Cold-Pressed Orange','Hand-picked valencia oranges, chilled to order, subtle orange-blossom','Drink',7500,4,'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop');

-- Staff
insert into staff (id,restaurant_id,name,role,phone) values
 ('W001','R001','Chidi Eze','Waiter','08099988877'),
 ('W002','R001','Ngozi Umeh','Waiter','08088877766'),
 ('W003','R001','Kunle Bello','Chef','08077766655'),
 ('W004','R001','Halima Sule','Chef','08066655544'),
 ('W005','R001','Segun Alade','Bartender','08055544433'),
 ('W006','R001','Blessing Okon','Bartender','08044433322'),
 ('W007','R002','Femi Adewale','Waiter','08033322211'),
 ('W008','R002','Emeka Nwosu','Chef','08022211100'),
 ('W009','R002','Rita Danjuma','Bartender','08011100099');

-- ---------- ACCESS ----------
-- No logins are required (the assignment says a simple role switch is enough),
-- so the app reads/writes directly with the key in the browser.
-- The simplest secure-enough setup for this assignment: turn RLS off on all
-- tables so the publishable key can read and write without policies.
alter table restaurants      disable row level security;
alter table customers        disable row level security;
alter table menu_items       disable row level security;
alter table staff            disable row level security;
alter table orders           disable row level security;
alter table order_items      disable row level security;
alter table complaints       disable row level security;
alter table payments         disable row level security;
