-- =============================================================
-- CHOWLY - Database schema + seed (Supabase / Postgres)
-- Paste this whole file into Supabase -> SQL Editor -> Run.
--
-- This file installs the COMPLETE final state on a fresh database:
-- tables, seed data and access. Re-running it is safe (teardown
-- drops everything first) but destructive — it erases existing
-- rows, so never run it against a database that holds real data
-- you want to keep.
--
-- Deliberate changes from the approved entity model:
--   1. Waiter, Chef and Bartender are merged into one `staff`
--      table with a `role` column (one list covers all three).
--   2. `menu_items.prep_time_mins` lets the app compute the
--      customer's waiting time from the longest single item.
--   3. `orders.status` drives the story: placed -> being_prepared
--      -> served -> paid.
--
-- CONTENTS
--   1. TEARDOWN  - drop everything, dependency-first (fresh start).
--   2. TABLES    - restaurants, customers, menu_items, staff,
--                  orders, order_items, complaints, payments.
--   3. SEED DATA - the complete menu (22 items per restaurant),
--                  customers and staff.
--   4. ACCESS    - RLS off so the browser key can read/write.
-- =============================================================

-- ---------- 1. TEARDOWN ----------
-- Drop in dependency-safe order (safe to re-run)
drop table if exists payments;
drop table if exists complaints;
drop table if exists order_items;
drop table if exists orders;
drop table if exists staff;
drop table if exists customers;
drop table if exists menu_items;
drop table if exists restaurants;

-- ---------- 2. TABLES ----------

-- Restaurant
create table restaurants (
  id          text primary key,
  name        text not null,
  address     text not null,
  phone       text,
  image_url   text
);

-- Customer
create table customers (
  id          text primary key,
  name        text not null,
  phone       text,
  email       text
);

-- Menu item (5 categories; IDs M1xx = The Lekki Grill, M2xx = Terra Kulture)
create table menu_items (
  id             text primary key,
  restaurant_id  text not null references restaurants(id),
  name           text not null,
  description    text,
  item_type      text not null
                    check (item_type in ('Starters','Mains','Grills','Desserts','Beverages')),
  price          numeric not null default 0,
  prep_time_mins integer not null default 0,
  image_url      text
);

-- Staff (the single merged list: Waiter / Chef / Bartender)
create table staff (
  id             text primary key,
  restaurant_id  text not null references restaurants(id),
  name           text not null,
  role           text not null check (role in ('Waiter','Chef','Bartender')),
  phone          text
);

-- Order (the central story object)
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

-- Order item (M:M bridge Order <-> MenuItem)
create table order_items (
  id            text primary key,
  order_id      text not null references orders(id),
  menu_item_id  text not null references menu_items(id),
  quantity      integer not null default 1,
  subtotal      numeric not null default 0
);

-- Complaint (rating + text, stored against the order)
create table complaints (
  id           text primary key,
  order_id     text not null references orders(id),
  customer_id  text not null references customers(id),
  description  text,
  rating       integer check (rating between 1 and 5),
  submitted_at timestamptz default now()
);

-- Payment (recorded against the order)
create table payments (
  id            text primary key,
  order_id      text not null references orders(id),
  amount        numeric not null,
  method        text not null default 'Pretend',
  status        text not null default 'Completed',
  paid_at       timestamptz default now()
);

-- ---------- 3. SEED DATA ----------

-- Restaurants
insert into restaurants values
 ('R001','The Lekki Grill','12 Admiralty Way, Lekki','08012345678','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=720&fit=crop'),
 ('R002','Terra Kulture Restaurant','1 Tiamiyu Savage, VI','08023456789','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=720&fit=crop');

-- Customers
insert into customers values
 ('C001','Ade Johnson','08011122233','ade.johnson@email.com'),
 ('C002','Amaka Obi','08022233344','amaka.obi@email.com'),
 ('C003','Tunde Bakare','08033344455','tunde.bakare@email.com');

-- Menu — 22 items per restaurant (Starters x3, Mains x5, Grills x5,
-- Beverages x7, Desserts x2). The two venues share the same menu.

-- ---- The Lekki Grill (R001) ----
insert into menu_items (id,restaurant_id,name,description,item_type,price,prep_time_mins,image_url) values
 -- Starters
 ('M105','R001','Garden Salad','Mixed greens, cherry tomatoes, cucumber, balsamic dressing','Starters',9500,8,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop'),
 ('M106','R001','Pepper Soup','Spicy peppery broth, tender meat, native herbs, warming heat','Starters',12000,20,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop'),
 ('M118','R001','Crispy Fried Wings','Double-fried wings, honey-garlic glaze, sesame seeds','Starters',12000,12,'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=400&fit=crop'),
 -- Mains
 ('M103','R001','Classic Beef Burger','100% beef patty, melted cheddar, lettuce, tomato, house sauce','Mains',15500,12,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop'),
 ('M104','R001','Margherita Pizza','San Marzano tomato, fresh mozzarella, basil, wood-fired crust','Mains',17000,15,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop'),
 ('M114','R001','Jollof Rice & Grilled Tilapia','Smoky party jollof, whole grilled tilapia, fried plantain','Mains',16000,18,'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop'),
 ('M115','R001','Cajun Shrimp Pasta','Blackened shrimp, creamy cajun sauce, tagliatelle','Mains',21500,15,'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop'),
 ('M117','R001','Chicken Curry & Rice','Coconut chicken curry, jasmine rice, fresh coriander','Mains',16500,17,'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop'),
 -- Grills
 ('M101','R001','BBQ Beef Ribs','Slow-cooked beef ribs, sticky barbecue glaze, smoky char','Grills',24500,20,'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop'),
 ('M102','R001','Grilled Chicken','Marinated grilled chicken, charred edges, garlic herb butter','Grills',18500,18,'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop'),
 ('M107','R001','Grilled Salmon','Seared salmon fillet, lemon butter, fresh herbs','Grills',26500,22,'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop'),
 ('M112','R001','Beef Shish Kebab','Char-grilled beef skewers, red onion, smoky spice rub','Grills',14000,20,'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop'),
 ('M116','R001','Suya Skewers','Spiced beef suya, yaji rub, sliced onions and tomatoes','Grills',11000,16,'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop'),
 -- Beverages
 ('M109','R001','Fresh Orange Juice','Hand-squeezed oranges, ice cold','Beverages',4500,3,'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop'),
 ('M111','R001','Coca-Cola','Ice-cold classic served with lemon','Beverages',2500,2,'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop'),
 ('M119','R001','Sparkling Water','Chilled sparkling water with a twist of lime','Beverages',3000,1,'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop'),
 ('M120','R001','Mango Smoothie','Fresh mango blended with yoghurt and mint','Beverages',6000,5,'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=400&fit=crop'),
 ('M121','R001','Chapman','Classic Nigerian mocktail: citrus, grenadine, bitters','Beverages',5500,6,'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop'),
 ('M122','R001','Iced Latte','Double espresso, chilled milk poured over ice','Beverages',5000,4,'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop'),
 ('M123','R001','House Red Wine','A smooth glass of the house merlot','Beverages',18000,3,'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop'),
 -- Desserts
 ('M124','R001','Chocolate Lava Cake','Warm molten chocolate cake, vanilla gelato, cocoa dust','Desserts',8500,10,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop'),
 ('M125','R001','Mango Panna Cotta','Silky vanilla panna cotta, fresh mango compote, mint','Desserts',7000,8,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop');

-- ---- Terra Kulture Restaurant (R002) ----
insert into menu_items (id,restaurant_id,name,description,item_type,price,prep_time_mins,image_url) values
 -- Starters
 ('M205','R002','Garden Salad','Mixed greens, cherry tomatoes, cucumber, balsamic dressing','Starters',9500,8,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop'),
 ('M206','R002','Pepper Soup','Spicy peppery broth, tender meat, native herbs, warming heat','Starters',12000,20,'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop'),
 ('M218','R002','Crispy Fried Wings','Double-fried wings, honey-garlic glaze, sesame seeds','Starters',12000,12,'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=400&fit=crop'),
 -- Mains
 ('M203','R002','Classic Beef Burger','100% beef patty, melted cheddar, lettuce, tomato, house sauce','Mains',15500,12,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop'),
 ('M204','R002','Margherita Pizza','San Marzano tomato, fresh mozzarella, basil, wood-fired crust','Mains',17000,15,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop'),
 ('M214','R002','Jollof Rice & Grilled Tilapia','Smoky party jollof, whole grilled tilapia, fried plantain','Mains',16000,18,'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop'),
 ('M215','R002','Cajun Shrimp Pasta','Blackened shrimp, creamy cajun sauce, tagliatelle','Mains',21500,15,'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop'),
 ('M217','R002','Chicken Curry & Rice','Coconut chicken curry, jasmine rice, fresh coriander','Mains',16500,17,'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop'),
 -- Grills
 ('M201','R002','BBQ Beef Ribs','Slow-cooked beef ribs, sticky barbecue glaze, smoky char','Grills',24500,20,'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop'),
 ('M202','R002','Grilled Chicken','Marinated grilled chicken, charred edges, garlic herb butter','Grills',18500,18,'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop'),
 ('M207','R002','Grilled Salmon','Seared salmon fillet, lemon butter, fresh herbs','Grills',26500,22,'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop'),
 ('M212','R002','Beef Shish Kebab','Char-grilled beef skewers, red onion, smoky spice rub','Grills',14000,20,'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop'),
 ('M216','R002','Suya Skewers','Spiced beef suya, yaji rub, sliced onions and tomatoes','Grills',11000,16,'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop'),
 -- Beverages
 ('M209','R002','Fresh Orange Juice','Hand-squeezed oranges, ice cold','Beverages',4500,3,'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop'),
 ('M211','R002','Coca-Cola','Ice-cold classic served with lemon','Beverages',2500,2,'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop'),
 ('M219','R002','Sparkling Water','Chilled sparkling water with a twist of lime','Beverages',3000,1,'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop'),
 ('M220','R002','Mango Smoothie','Fresh mango blended with yoghurt and mint','Beverages',6000,5,'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=400&fit=crop'),
 ('M221','R002','Chapman','Classic Nigerian mocktail: citrus, grenadine, bitters','Beverages',5500,6,'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop'),
 ('M222','R002','Iced Latte','Double espresso, chilled milk poured over ice','Beverages',5000,4,'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop'),
 ('M223','R002','House Red Wine','A smooth glass of the house merlot','Beverages',18000,3,'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop'),
 -- Desserts
 ('M224','R002','Chocolate Lava Cake','Warm molten chocolate cake, vanilla gelato, cocoa dust','Desserts',8500,10,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop'),
 ('M225','R002','Mango Panna Cotta','Silky vanilla panna cotta, fresh mango compote, mint','Desserts',7000,8,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop');

-- Staff
insert into staff (id,restaurant_id,name,role,phone) values
 -- The Lekki Grill (R001): 2 waiters, 2 chefs, 2 bartenders
 ('W001','R001','Chidi Eze','Waiter','08099988877'),
 ('W002','R001','Ngozi Umeh','Waiter','08088877766'),
 ('W003','R001','Kunle Bello','Chef','08077766655'),
 ('W004','R001','Halima Sule','Chef','08066655544'),
 ('W005','R001','Segun Alade','Bartender','08055544433'),
 ('W006','R001','Blessing Okon','Bartender','08044433322'),
 -- Terra Kulture (R002): 1 waiter, 1 chef, 1 bartender
 ('W007','R002','Femi Adewale','Waiter','08033322211'),
 ('W008','R002','Emeka Nwosu','Chef','08022211100'),
 ('W009','R002','Rita Danjuma','Bartender','08011100099');

-- ---------- 4. ACCESS ----------
-- No logins are required (a simple role switch is enough), so the app reads
-- and writes directly with the browser key. Turn RLS off on every table so
-- the publishable key can read and write without policies.
alter table restaurants disable row level security;
alter table customers   disable row level security;
alter table menu_items  disable row level security;
alter table staff       disable row level security;
alter table orders      disable row level security;
alter table order_items disable row level security;
alter table complaints  disable row level security;
alter table payments    disable row level security;