import { getSupabase } from './supabase';

const db = () => getSupabase();

export async function getRestaurants() {
  const { data, error } = await db().from('restaurants').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getMenu(restaurantId) {
  const { data, error } = await db()
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('item_type')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getCustomers() {
  const { data, error } = await db().from('customers').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getStaff(restaurantId) {
  const { data, error } = await db()
    .from('staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('role')
    .order('name');
  if (error) throw error;
  return data;
}

export async function placeOrder({ customerId, restaurantId, items, totalAmount, waitingTime, notes, vatAmount }) {
  const orderId = `O${Date.now()}`;
  const { data: order, error: orderErr } = await db()
    .from('orders')
    .insert([
      {
        id: orderId,
        customer_id: customerId,
        restaurant_id: restaurantId,
        status: 'placed',
        total_amount: totalAmount,
        waiting_time: waitingTime,
        vat_amount: vatAmount || 0,
        notes: notes || null,
      },
    ])
    .select()
    .single();
  if (orderErr) throw orderErr;

  const orderItems = items.map((it) => ({
    id: `OI${Date.now()}_${it.menu_item_id}`,
    order_id: orderId,
    menu_item_id: it.menu_item_id,
    quantity: it.quantity,
    subtotal: it.subtotal,
  }));
  const { error: itemsErr } = await db().from('order_items').insert(orderItems);
  if (itemsErr) throw itemsErr;

  return order;
}

export async function getOrders(status) {
  let query = db()
    .from('orders')
    .select('*, customers(name), restaurants(name)')
    .order('created_at', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getOrderDetails(orderId) {
  const { data, error } = await db()
    .from('orders')
    .select('*, customers(name), restaurants(name), order_items(*, menu_items(name, price))')
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId, updates) {
  const { data, error } = await db()
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getComplaints(orderId) {
  const { data, error } = await db()
    .from('complaints')
    .select('*')
    .eq('order_id', orderId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitComplaint({ orderId, customerId, description, rating }) {
  const id = `CMP${Date.now()}`;
  const { data, error } = await db()
    .from('complaints')
    .insert([
      {
        id,
        order_id: orderId,
        customer_id: customerId,
        description,
        rating,
        submitted_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitPayment({ orderId, amount }) {
  const id = `PAY${Date.now()}`;
  const { data, error } = await db()
    .from('payments')
    .insert([
      {
        id,
        order_id: orderId,
        amount,
        method: 'Card',
        status: 'Completed',
        paid_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPayment(orderId) {
  const { data, error } = await db()
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
