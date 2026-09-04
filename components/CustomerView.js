'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageWithFallback from '@/components/ImageWithFallback';
import OrderTimeline from '@/components/OrderTimeline';
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
import { useModal } from '@/lib/useModal';
import { fmt, shortId, splitVat, VAT_RATE } from '@/lib/format';

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

  const [notes, setNotes] = useState('');

  const [complainOrder, setComplainOrder] = useState(null);
  const [rating, setRating] = useState(1);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const complainTitleRef = useModal(complainOrder !== null, () => setComplainOrder(null));

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
    if (!customer) {
      toast('Pick the customer you are acting as first.');
      return;
    }
    setSelectedRestaurant(r);
    setCart({});
    try {
      const m = await getMenu(r.id);
      setMenu(m);
    } catch (e) {
      toast('Could not load menu: ' + e.message);
    }
  };

  const closeMenu = () => {
    setSelectedRestaurant(null);
    setMenu([]);
    setCart({});
    setNotes('');
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
  const vat = splitVat(totalAmount);
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
        vatAmount: vat.vat,
        notes: notes.trim() || null,
      });
      setRecentOrder(order);
      setCart({});
      setNotes('');
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
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-sub" />
        <div className="restaurant-grid">
          {[1, 2].map((i) => (
            <div key={i} className="restaurant-card">
              <div className="restaurant-img-wrap">
                <div className="skeleton skeleton-img" />
              </div>
              <div className="restaurant-info skeleton-stack">
                <div className="skeleton skeleton-text skeleton-w60" />
                <div className="skeleton skeleton-text skeleton-w40" />
              </div>
            </div>
          ))}
        </div>
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

      <div className="card u-pad u-mb24">
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
            className={`restaurant-card ${selectedRestaurant?.id === r.id ? 'selected' : ''}`}
            onClick={() => openRestaurant(r)}
          >
            <div className="restaurant-img-wrap">
              <ImageWithFallback
                className="restaurant-img"
                src={r.image_url}
                alt={r.name}
                fallbackText={r.name.charAt(0)}
                width={900}
                height={720}
              />
            </div>
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
            <div className="menu-head">
              <h1 className="page-title">{selectedRestaurant.name} — Menu</h1>
              <button className="btn btn-ghost" onClick={closeMenu}>
                ← Change restaurant
              </button>
            </div>
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
                <div className="line vat-block u-mt16">
                  <span>Subtotal (excl. VAT)</span>
                  <span>{fmt(vat.excl)}</span>
                </div>
                <div className="line vat-line">
                  <span>VAT ({Math.round(VAT_RATE * 100)}%)</span>
                  <span>{fmt(vat.vat)}</span>
                </div>
                <div className="total">
                  <span>Total incl. VAT</span>
                  <strong>{fmt(totalAmount)}</strong>
                </div>
                <div className="note">
                  Menu prices include {Math.round(VAT_RATE * 100)}% VAT · Est. waiting ~
                  {waitingTime} mins
                </div>
                <label className="field-label u-mt16" htmlFor="order-notes">
                  Special requests
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  maxLength={280}
                  placeholder="Allergies, spice level, sitting preferences…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="u-mt16">
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
        <div className="card confirm-card u-pad u-mt32">
          <span className="badge placed">Order placed</span>
          <h2 style={{ margin: '8px 0' }}>Order {shortId(recentOrder.id)}</h2>
          <p>
            Waiting time: <strong>~{recentOrder.waiting_time} mins</strong> · Total:{' '}
            <strong>{fmt(recentOrder.total_amount)}</strong>
          </p>
          <div className="confirm-sum">
            <div className="line">
              <span>Subtotal (excl. VAT)</span>
              <span>
                {fmt(
                  recentOrder.total_amount -
                    (recentOrder.vat_amount ?? splitVat(recentOrder.total_amount).vat)
                )}
              </span>
            </div>
            <div className="line vat-line">
              <span>VAT ({Math.round(VAT_RATE * 100)}%)</span>
              <span>{fmt(recentOrder.vat_amount ?? splitVat(recentOrder.total_amount).vat)}</span>
            </div>
            <div className="line confirm-total">
              <span>Total incl. VAT</span>
              <strong>{fmt(recentOrder.total_amount)}</strong>
            </div>
          </div>
          <p className="note">
            Track it live below — switch to the Waiter view to start prep.
          </p>
          {recentOrder.notes && (
            <p className="note request-note">Request: {recentOrder.notes}</p>
          )}
        </div>
      )}

      {/* Tracking / orders */}
      <h1 className="page-title u-mt32">Your Orders</h1>
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
        <div
          className="modal-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget) setComplainOrder(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complain-title"
          >
            <h2 id="complain-title" tabIndex={-1} ref={complainTitleRef}>
              Complaint & Rating
            </h2>
            <div className="sub">Order {shortId(complainOrder.id)}</div>

            <span className="field-label">Rating</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star ${s <= rating ? 'on' : ''}`}
                  onClick={() => setRating(s)}
                  aria-pressed={s <= rating}
                  aria-label={`${s} of 5 stars`}
                >
                  ★
                </button>
              ))}
            </div>

            <span className="field-label">Complaint</span>
            <textarea
              rows={3}
              placeholder="Tell us what went wrong…"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
            />

            <div className="u-flex">
              <button
                className="btn btn-ghost u-grow"
                onClick={() => setComplainOrder(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary u-grow2"
                disabled={submitting}
                onClick={saveComplaint}
              >
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
      <ImageWithFallback
        className="menu-item-img"
        src={item.image_url}
        alt={item.name}
        fallbackText={item.name.charAt(0)}
        width={76}
        height={76}
      />
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
          <button onClick={() => add(item, -1)} aria-label={`Remove one ${item.name}`}>−</button>
          <span>{qty}</span>
          <button onClick={() => add(item, 1)} aria-label={`Add one ${item.name}`}>+</button>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, statusLabel, fmt, onComplain, onPay }) {
  return (
    <div className="order-card card">
      <div className="head">
        <span className="oid">{shortId(order.id)}</span>
        <span className={`badge ${order.status}`}>{statusLabel[order.status]}</span>
      </div>
      <div className="wait">
        Waiting: <strong>~{order.waiting_time ?? '—'} mins</strong>
      </div>
      {order.notes && <div className="request-chip">✎ {order.notes}</div>}
      <OrderTimeline status={order.status} />
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
