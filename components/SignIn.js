'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCustomers, getRestaurants, getWaiters, getOrCreateCustomer } from '@/lib/data';
import { useToast } from '@/components/Toast';

const pickMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export default function SignIn({ onSignIn }) {
  const toast = useToast();
  const [step, setStep] = useState('pick');
  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, w, r] = await Promise.all([getCustomers(), getWaiters(), getRestaurants()]);
        setCustomers(c);
        setWaiters(w);
        setRestaurantNames(Object.fromEntries(r.map((x) => [x.id, x.name])));
      } catch (e) {
        toast('Could not load sign-in options: ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const back = () => setStep('pick');

  const signInCustomer = (c) =>
    onSignIn({ role: 'customer', id: c.id, name: c.name, phone: c.phone || '' });

  const signInWaiter = (w) =>
    onSignIn({
      role: 'waiter',
      id: w.id,
      name: w.name,
      restaurantId: w.restaurant_id,
      restaurantName: restaurantNames[w.restaurant_id] || '',
    });

  const continueAsNewGuest = async () => {
    if (!newName.trim()) return toast('Please enter your name.');
    setBusy(true);
    try {
      const created = await getOrCreateCustomer(newName, newPhone);
      signInCustomer(created);
    } catch (e) {
      toast('Could not sign in: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <AnimatePresence mode="wait">
        {step === 'pick' && (
          <motion.div key="pick" className="signin-step" {...pickMotion}>
            <span className="eyebrow">Chowly · Table Service</span>
            <h1 className="page-title">Welcome</h1>
            <p className="page-sub">
              Sign in to begin. Guests browse the menu, order, track and pay — staff run the
              service queue.
            </p>

            <div className="signin-actions">
              <button className="choice-card" onClick={() => setStep('customer')} disabled={loading}>
                <span className="choice-icon">☕</span>
                <span className="choice-title">Dine in as a guest</span>
                <span className="choice-sub">Order food and track it live</span>
              </button>
              <button className="choice-card" onClick={() => setStep('waiter')} disabled={loading}>
                <span className="choice-icon">◈</span>
                <span className="choice-title">Staff entrance</span>
                <span className="choice-sub">Run the service queue</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'customer' && (
          <motion.div key="customer" className="signin-step" {...pickMotion}>
            <button className="btn btn-ghost u-mb16" onClick={back}>
              ← Back
            </button>
            <span className="eyebrow">Guest</span>
            <h1 className="page-title">Who is dining?</h1>
            <p className="page-sub">
              Pick a name below, or continue as a new guest — the same name always signs you back
              in to the same guest.
            </p>

            <div className="customer-select">
              {customers.map((c) => (
                <button key={c.id} className="customer-option" onClick={() => signInCustomer(c)}>
                  <span className="nm">{c.name}</span>
                  <div className="em">{c.email}</div>
                </button>
              ))}
            </div>

            <div className="signin-divider">or come as a new guest</div>

            <label className="field-label" htmlFor="guest-name">
              Your name
            </label>
            <input
              id="guest-name"
              type="text"
              maxLength={60}
              placeholder="e.g. Bola Adewale"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <label className="field-label" htmlFor="guest-phone">
              Phone <span className="muted-inline">(optional)</span>
            </label>
            <input
              id="guest-phone"
              type="text"
              maxLength={20}
              placeholder="08000000000"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <button className="btn btn-primary u-mt8" disabled={busy} onClick={continueAsNewGuest}>
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          </motion.div>
        )}

        {step === 'waiter' && (
          <motion.div key="waiter" className="signin-step" {...pickMotion}>
            <button className="btn btn-ghost u-mb16" onClick={back}>
              ← Back
            </button>
            <span className="eyebrow">Staff</span>
            <h1 className="page-title">Who is on shift?</h1>
            <p className="page-sub">Pick your name. You’ll be auto-assigned as the waiter on the orders you prepare.</p>

            {Object.keys(restaurantNames).map((rid) => {
              const crew = waiters.filter((w) => w.restaurant_id === rid);
              if (!crew.length) return null;
              return (
                <div key={rid} className="u-mb8">
                  <div className="label">{restaurantNames[rid]}</div>
                  <div className="customer-select">
                    {crew.map((w) => (
                      <button key={w.id} className="customer-option" onClick={() => signInWaiter(w)}>
                        <span className="nm">{w.name}</span>
                        <div className="em">{w.phone}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}