'use client';

import { useEffect, useState } from 'react';
import {
  getOrders,
  getOrderDetails,
  getStaff,
  updateOrderStatus,
} from '@/lib/data';
import { useToast } from '@/components/Toast';

const fmt = (n) => '₦' + Number(n).toLocaleString();

export default function WaiterView() {
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
      setWaiterId(detail.waiter_id || '');
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

  const statusLabel = {
    placed: 'placed',
    being_prepared: 'being prepared',
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Loading…</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Waiter Dashboard</h1>
      <p className="page-sub">Incoming orders. Open one, assign the kitchen staff, mark served.</p>

      {orders.length === 0 ? (
        <div className="card empty">No incoming orders right now. New orders will appear here.</div>
      ) : (
        <div className="order-grid">
          {orders.map((o) => (
            <div key={o.id} className="order-card card">
              <div className="head">
                <span className="oid">{o.id}</span>
                <span className={`badge ${o.status}`}>{statusLabel[o.status]}</span>
              </div>
              <div className="wait">Customer: <strong>{o.customers?.name}</strong></div>
              <div className="wait">Waiting: {o.waiting_time ?? '—'} mins</div>
              <div className="amount">{fmt(o.total_amount)}</div>
              <div className="actions">
                <button className="btn btn-blue" onClick={() => openOrder(o.id)}>
                  Open Order →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {orderDetail && (
        <div className="modal-wrap">
          <div className="modal">
            <h2>Order {orderDetail.id}</h2>
            <div className="sub">
              {orderDetail.restaurants?.name} · Customer: {orderDetail.customers?.name} ·{' '}
              {fmt(orderDetail.total_amount)}
            </div>

            <span className="field-label" style={{ marginTop: 14 }}>
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

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={closeModal}>
                Close
              </button>
              {orderDetail.status === 'placed' && (
                <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={beginPrep}>
                  Assign & Start Prep
                </button>
              )}
              {orderDetail.status === 'being_prepared' && (
                <button className="btn btn-green" style={{ flex: 2 }} disabled={saving} onClick={markServed}>
                  Mark as Served
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
