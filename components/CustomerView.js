'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  getRestaurants,
  getMenu,
  getCustomers,
  placeOrder,
  getOrders,
  getOrderDetails,
  submitComplaint,
  submitPayment,
  updateOrderStatus,
} from '@/lib/data';
import { useToast } from '@/components/Toast';

const fmt = (n) => '₦' + Number(n).toLocaleString();

export default function CustomerView() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});

  const [recentOrder, setRecentOrder] = useState(null);
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [orders, setOrders] = useState([]);

  const [complainOrder, setComplainOrder] = useState(null);
  const [rating, setRating] = useState(1);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [placing, setPlacing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const all = await getOrders();
      const mine = customer
        ? all.filter((o) => o.customer_id === customer.id)
        : [];
      setOrders(all);
      setTrackingOrders(mine);
    } catch (e) {
      // ignore polling errors
    }
  }, [customer]);

  useEffect(() => {
    (async () => {
      try {
        const [r, c] = await Promise.all([getRestaurants(), getCustomers()]);
        setRestaurants(r);
        setCustomers(c);
      } catch (e) {
        toast('Failed to load. Is the database seeded? ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    (async () => {
      await loadOrders();
    })();
    const id = setInterval(() => loadOrders(), 5000);
    return () => clearInterval(id);
  }, [customer, loadOrders]);

  const openRestaurant = async (r) => {
    setSelectedRestaurant(r);
    setCart({});
    if (!customer) {
      toast('Pick the customer you are acting as first.');
      return;
    }
    try {
      const m = await getMenu(r.id);
      setMenu(m);
    } catch (e) {
      toast('Could not load menu: ' + e.message);
    }
  };

  const add = (item, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const cur = next[item.id] || 0;
      const v = cur + delta;
      if (v <= 0) delete next[item.id];
      else next[item.id] = v;
      return next;
    });
  };

  const cartItems = Object.keys(cart)
    .map((id) => menu.find((m) => m.id === id))
    .filter(Boolean)
    .map((item) => ({
      menu_item_id: item.id,
      quantity: cart[item.id],
      price: Number(item.price),
      subtotal: cart[item.id] * Number(item.price),
    }));
  const totalAmount = cartItems.reduce((s, it) => s + it.subtotal, 0);
  const waitingTime = cartItems.length
    ? Math.max(...cartItems.map((it) => {
        const item = menu.find((m) => m.id === it.menu_item_id);
        return Number(item.prep_time_mins || 0);
      }))
    : 0;

  const submitOrder = async () => {
    if (!customer) return toast('Select which customer is ordering.');
    if (!cartItems.length) return toast('Add at least one item.');
    setPlacing(true);
    try {
      const order = await placeOrder({
        customerId: customer.id,
        restaurantId: selectedRestaurant.id,
        items: cartItems,
        totalAmount,
        waitingTime,
      });
      setRecentOrder(order);
      setCart({});
      toast('Order placed! Waiting time ~' + waitingTime + ' mins');
      loadOrders();
    } catch (e) {
      toast('Order failed: ' + e.message);
    } finally {
      setPlacing(false);
    }
  };

  const openComplain = (order) => {
    setComplainOrder(order);
    setRating(1);
    setComplaintText('');
  };

  const saveComplaint = async () => {
    if (!complaintText.trim()) return toast('Describe the complaint.');
    setSubmitting(true);
    try {
      await submitComplaint({
        orderId: complainOrder.id,
        customerId: complainOrder.customer_id,
        description: complaintText.trim(),
        rating,
      });
      toast('Complaint & rating submitted.');
      setComplainOrder(null);
    } catch (e) {
      toast('Complaint failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pay = async (order) => {
    try {
      await submitPayment({ orderId: order.id, amount: order.total_amount });
      await updateOrderStatus(order.id, { status: 'paid' });
      loadOrders();
      toast('Payment recorded. Order is now PAID. Enjoy your meal!');
    } catch (e) {
      toast('Payment failed: ' + e.message);
    }
  };

  const statusLabel = {
    placed: 'placed',
    being_prepared: 'being prepared',
    served: 'served',
    paid: 'paid',
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Loading Chowly…</h1>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Step 1: who is ordering */}
      <h1 className="page-title">Customer Dining Experience</h1>
      <p className="page-sub">
        Act as a customer: pick who you are, choose a restaurant, order, track and pay.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <span className="label">Step 1 — Who is the customer?</span>
        <div className="customer-select">
          {customers.map((c) => (
            <button
              key={c.id}
              className={`customer-option ${customer?.id === c.id ? 'selected' : ''}`}
              onClick={() => setCustomer(c)}
            >
              <span className="nm">{c.name}</span>
              <div className="em">{c.email}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: choose restaurant */}
      <span className="label">Step 2 — Choose a restaurant</span>
      <div className="restaurant-grid" style={{ marginBottom: 24 }}>
        {restaurants.map((r) => (
          <button
            key={r.id}
            className="restaurant-card"
            onClick={() => openRestaurant(r)}
          >
            {r.image_url && (
              <div className="restaurant-img-wrap">
                <Image
                  className="restaurant-img"
                  src={r.image_url}
                  alt={r.name}
                  width={900}
                  height={720}
                />
              </div>
            )}
            <div className="restaurant-info">
              <h3>{r.name}</h3>
              <div className="addr">{r.address}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Step 3: menu + cart */}
      {selectedRestaurant ? (
        <div className="menu-layout">
          <div>
            <h1 className="page-title">
              {selectedRestaurant.name} — Menu
            </h1>
            {!menu.length ? (
              <div className="card empty">No menu items found for this restaurant.</div>
            ) : (
              <>
                <div className="menu-section">
                  <h2>Food</h2>
                  {menu
                    .filter((m) => m.item_type === 'Food')
                    .map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        qty={cart[item.id] || 0}
                        add={add}
                      />
                    ))}
                </div>
                <div className="menu-section">
                  <h2>Drinks</h2>
                  {menu
                    .filter((m) => m.item_type === 'Drink')
                    .map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        qty={cart[item.id] || 0}
                        add={add}
                      />
                    ))}
                </div>
              </>
            )}
          </div>

          <div className="cart card">
            <h2>Your Order</h2>
            {cartItems.length === 0 ? (
              <div className="empty">No items yet. Add some from the menu.</div>
            ) : (
              <>
                {cartItems.map((it) => {
                  const item = menu.find((m) => m.id === it.menu_item_id);
                  return (
                    <div className="line" key={it.menu_item_id}>
                      <span>
                        {item.name} ×{it.quantity}
                      </span>
                      <span>{fmt(it.subtotal)}</span>
                    </div>
                  );
                })}
                <div className="total">
                  <span>Total</span>
                  <span>{fmt(totalAmount)}</span>
                </div>
                <div className="note">Estimated waiting time: ~{waitingTime} mins</div>
                <div style={{ marginTop: 14 }}>
                  <button className="btn btn-primary" disabled={placing} onClick={submitOrder}>
                    {placing ? 'Placing…' : 'Submit Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card empty">Choose a restaurant above to see its menu.</div>
      )}

      {/* Confirmation of placed order */}
      {recentOrder && (
        <div className="card" style={{ padding: 20, marginTop: 24 }}>
          <span className="badge placed">Order placed</span>
          <h2 style={{ margin: '8px 0' }}>Order {recentOrder.id}</h2>
          <p>
            Waiting time: <strong>~{recentOrder.waiting_time} mins</strong> · Total:{' '}
            <strong>{fmt(recentOrder.total_amount)}</strong>
          </p>
          <p className="note">You can track it live in the section below.</p>
        </div>
      )}

      {/* Tracking / orders */}
      <h1 className="page-title" style={{ marginTop: 32 }}>Your Orders</h1>
      <p className="page-sub">Live status updates (refreshes automatically).</p>
      {trackingOrders.length === 0 ? (
        <div className="card empty">No orders yet for {customer ? customer.name : 'this customer'}.</div>
      ) : (
        <div className="order-grid">
          {trackingOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              statusLabel={statusLabel}
              fmt={fmt}
              onComplain={() => openComplain(o)}
              onPay={() => pay(o)}
            />
          ))}
        </div>
      )}

      {/* Complaint modal */}
      {complainOrder && (
        <div className="modal-wrap">
          <div className="modal">
            <h2>Complaint & Rating</h2>
            <div className="sub">Order {complainOrder.id}</div>

            <span className="field-label">Rating</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`star ${s <= rating ? 'on' : ''}`}
                  onClick={() => setRating(s)}
                >
                  ★
                </span>
              ))}
            </div>

            <span className="field-label">Complaint</span>
            <textarea
              rows={3}
              placeholder="Tell us what went wrong…"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setComplainOrder(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} disabled={submitting} onClick={saveComplaint}>
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemRow({ item, qty, add }) {
  return (
    <div className="menu-item">
      {item.image_url && (
        <Image
          className="menu-item-img"
          src={item.image_url}
          alt={item.name}
          width={76}
          height={76}
        />
      )}
      <div className="meta">
        <div className="name">{item.name}</div>
        {item.description && <div className="desc">{item.description}</div>}
        <div className="desc" style={{ marginTop: 4 }}>~{item.prep_time_mins} mins prep</div>
      </div>
      <div className="price">{fmt(item.price)}</div>
      {qty === 0 ? (
        <button className="btn btn-ghost" style={{ padding: '10px 18px' }} onClick={() => add(item, 1)}>
          Add
        </button>
      ) : (
        <div className="qty-box">
          <button onClick={() => add(item, -1)}>−</button>
          <span>{qty}</span>
          <button onClick={() => add(item, 1)}>+</button>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, statusLabel, fmt, onComplain, onPay }) {
  return (
    <div className="order-card card">
      <div className="head">
        <span className="oid">{order.id}</span>
        <span className={`badge ${order.status}`}>{statusLabel[order.status]}</span>
      </div>
      <div className="wait">
        Waiting: <strong>~{order.waiting_time ?? '—'} mins</strong>
      </div>
      <div className="amount">{fmt(order.total_amount)}</div>
      <div className="actions">
        {order.status === 'being_prepared' && (
          <button className="btn btn-red" onClick={onComplain}>
            Delayed? Complain & Rate
          </button>
        )}
        {order.status === 'served' && (
          <button className="btn btn-green" onClick={onPay}>
            Pay — Settle Balance
          </button>
        )}
      </div>
    </div>
  );
}
