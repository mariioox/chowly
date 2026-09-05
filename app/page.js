'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CustomerView from '@/components/CustomerView';
import WaiterView from '@/components/WaiterView';
import SignIn from '@/components/SignIn';
import AccountMenu from '@/components/AccountMenu';

const STORAGE_KEY = 'chowly.session';
const SESSION_EVENT = 'chowly:session';

function readRaw() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribeSession(cb) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export default function Home() {
  const rawSession = useSyncExternalStore(subscribeSession, readRaw, () => null);

  const session = useMemo(() => {
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession);
    } catch {
      return null;
    }
  }, [rawSession]);

  const saveSession = (next) => {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="logo">Chowly</span>
        </div>
        {session && <AccountMenu session={session} onSignOut={() => saveSession(null)} />}
      </header>

      {!session ? (
        <SignIn onSignIn={saveSession} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={session.role}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {session.role === 'customer' ? (
              <CustomerView identity={session} />
            ) : (
              <WaiterView identity={session} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}