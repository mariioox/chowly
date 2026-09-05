'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getOrders,
  getOrderDetails,
  getStaff,
  updateOrderStatus,
} from '@/lib/data';
import { useToast } from '@/components/Toast';
import { useModal } from '@/lib/useModal';
import { useNow } from '@/lib/useNow';
import { fmt, shortId } from '@/lib/format';
import OrderTimeline from '@/components/OrderTimeline';
import Countdown from '@/components/Countdown';
import Reveal from '@/components/Reveal';

const statusLabel = {
  placed: 'placed',
  being_prepared: 'in prep',
};

const baseTimeOf = (o) => {
  const base =
    o.status === 'being_prepared' && o.updated_at ? o.updated_at : o.created_at;
  return base ? new Date(base).getTime() : null;
};

const isOverdue = (o, now) => {
  const base = baseTimeOf(o) ?? now;
  const deadline = base + (Number(o.waiting_time) || 0) * 60000;
  return deadline < now;
};

function ServiceQueue({ orders, onOpen }) {
  const now = useNow(1000);

  const placedCount = orders.filter((o) => o.status === 'placed').length;
  const prepCount = orders.filter((o) => o.status === 'being_prepared').length;
  const overdueCount = orders.filter(
    (o) => o.status === 'being_prepared' && isOverdue(o, now)
  ).length;

  return (
    <>
      <Reveal>
        <div className="svc-bar">
          <div className="svc-bar-title">
            <span className="label">Service queue</span>
            <div className="svc-clock">{new Date(now).toLocaleTimeString()}</div>
          </div>
          <div className="svc-chips">
            <span className="svc-chip">{placedCount} placed</span>
            <span className="svc-chip prep">{prepCount} in prep</span>
            <span className={`svc-chip ${overdueCount ? 'danger' : ''}`}>
              {overdueCount} overdue
            </span>
          </div>
        </div>
      </Reveal>

      {orders.length === 0 ? (
        <div className="card empty">No incoming orders right now. New orders will appear here.</div>
      ) : (
        <div className="order-grid">
          <AnimatePresence initial={false}>
            {orders.map((o) => {
              const inPrep = o.status === 'being_prepared';
              return (
                <motion.div
                  key={o.id}
                  className={`order-card card svc-card ${inPrep && isOverdue(o, now) ? 'svc-card-danger' : ''}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="head">
                    <span className="oid">{shortId(o.id)}</span>
                    <span className={`badge ${o.status}`}>{statusLabel[o.status]}</span>
                  </div>
                  <div className="wait">Customer: <strong>{o.customers?.name}</strong></div>
                  {inPrep ? (
                    <Countdown baseTime={baseTimeOf(o)} waitingMinutes={o.waiting_time} />
                  ) : (
                    <div className="wait">Est. prep: <strong>~{o.waiting_time ?? '—'} mins</strong></div>
                  )}
                  {o.notes && <div className="request-chip">✎ {o.notes}</div>}
                  <OrderTimeline status={o.status} compact />
                  <div className="amount">{fmt(o.total_amount)}</div>
                  <div className="actions">
                    <motion.button
                      className="btn btn-blue"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onOpen(o.id)}
                    >
                      Open Order
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function WaiterView({ identity }) {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openOrderId, setOpenOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [staff, setStaff] = useState([]);

  const [waiterId, setWaiterId] = useState('');
  const [chefId, setChefId] = useState('');
  const [bartenderId, setBartenderId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadActive = async () => {
    try {
      const all = await getOrders();
      const active = all.filter((o) => ['placed', 'being_prepared'].includes(o.status));
      setOrders(active);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadActive();
    })();
    const id = setInterval(() => loadActive(), 5000);
    return () => clearInterval(id);
  }, []);

  const openOrder = async (orderId) => {
    setOpenOrderId(orderId);
    try {
      const detail = await getOrderDetails(orderId);
      setOrderDetail(detail);
      const staffList = await getStaff(detail.restaurant_id);
      setStaff(staffList);
      const signedInWaiterWorksHere = identity && staffList.some((s) => s.id === identity.id);
      setWaiterId(signedInWaiterWorksHere ? identity.id : detail.waiter_id || '');
      setChefId(detail.chef_id || '');
      setBartenderId(detail.bartender_id || '');
    } catch (e) {
      toast('Could not open order: ' + e.message);
    }
  };

  const byRole = (role) => staff.filter((s) => s.role === role);

  const beginPrep = async () => {
    if (!waiterId || !chefId || !bartenderId)
      return toast('Assign the waiter, chef and bartender.');
    setSaving(true);
    try {
      await updateOrderStatus(openOrderId, {
        waiter_id: waiterId,
        chef_id: chefId,
        bartender_id: bartenderId,
        status: 'being_prepared',
      });
      toast('Order assigned and marked as being prepared.');
      closeModal();
      loadActive();
    } catch (e) {
      toast('Assignment failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const markServed = async () => {
    setSaving(true);
    try {
      await updateOrderStatus(openOrderId, { status: 'served' });
      toast('Order marked as SERVED. Customer will be notified to pay.');
      closeModal();
      loadActive();
    } catch (e) {
      toast('Update failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setOpenOrderId(null);
    setOrderDetail(null);
  };

  const modalFocusRef = useModal(orderDetail !== null, closeModal);

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-sub" />
        <div className="order-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="order-card card skeleton-stack">
              <div className="skeleton skeleton-text skeleton-w60" />
              <div className="skeleton skeleton-text skeleton-w40" />
              <div className="skeleton skeleton-text skeleton-w30" />
              <div className="skeleton skeleton-btn" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Reveal className="view-head">
        <span className="eyebrow">Chowly · Staff entrance · {identity?.name}</span>
        <h1 className="page-title">Service Desk</h1>
        <p className="page-sub">
          Signed in as {identity?.name} — you’re pre-assigned as the waiter on orders you start
          prep on.
        </p>
      </Reveal>

      <ServiceQueue orders={orders} onOpen={openOrder} />

      <AnimatePresence>
        {orderDetail && (
          <motion.div
            className="modal-wrap modal-wrap-motion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-modal-title"
              initial={{ y: 24, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.97, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              <h2 id="order-modal-title" tabIndex={-1} ref={modalFocusRef}>
                Order {shortId(orderDetail.id)}
              </h2>
              <div className="sub">
                {orderDetail.restaurants?.name} · Customer: {orderDetail.customers?.name} ·{' '}
                {fmt(orderDetail.total_amount)}
              </div>

              <span className="field-label u-mt16">
                Items
              </span>
              {orderDetail.order_items?.map((it) => (
                <div className="line" key={it.id}>
                  <span>
                    {it.menu_items?.name} ×{it.quantity}
                  </span>
                  <span>{fmt(it.subtotal)}</span>
                </div>
              ))}

              {orderDetail.status === 'being_prepared' && (
                <Countdown baseTime={baseTimeOf(orderDetail)} waitingMinutes={orderDetail.waiting_time} />
              )}

              {orderDetail.notes && (
                <>
                  <span className="field-label">Special request</span>
                  <div className="request-chip">✎ {orderDetail.notes}</div>
                </>
              )}

              <span className="field-label">Waiter</span>
              <select value={waiterId} onChange={(e) => setWaiterId(e.target.value)}>
                <option value="">— select waiter —</option>
                {byRole('Waiter').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <span className="field-label">Chef</span>
              <select value={chefId} onChange={(e) => setChefId(e.target.value)}>
                <option value="">— select chef —</option>
                {byRole('Chef').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <span className="field-label">Bartender</span>
              <select value={bartenderId} onChange={(e) => setBartenderId(e.target.value)}>
                <option value="">— select bartender —</option>
                {byRole('Bartender').map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div className="u-flex u-mt16">
                <button className="btn btn-ghost u-grow" onClick={closeModal}>
                  Close
                </button>
                {orderDetail.status === 'placed' && (
                  <button className="btn btn-primary u-grow2" disabled={saving} onClick={beginPrep}>
                    Assign & Start Prep
                  </button>
                )}
                {orderDetail.status === 'being_prepared' && (
                  <button className="btn btn-green u-grow2" disabled={saving} onClick={markServed}>
                    Mark as Served
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}