'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CustomerView from '@/components/CustomerView';
import WaiterView from '@/components/WaiterView';

export default function Home() {
  const [role, setRole] = useState('customer');

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="logo">Chowly</span>
        </div>
        <div className="role-switch" role="group" aria-label="Switch between customer and waiter">
          <button
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            aria-pressed={role === 'customer'}
            onClick={() => setRole('customer')}
          >
            {role === 'customer' && (
              <motion.span
                className="role-pill"
                layoutId="role-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="role-btn-label">Customer</span>
          </button>
          <button
            className={`role-btn ${role === 'waiter' ? 'active' : ''}`}
            aria-pressed={role === 'waiter'}
            onClick={() => setRole('waiter')}
          >
            {role === 'waiter' && (
              <motion.span
                className="role-pill"
                layoutId="role-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="role-btn-label">Waiter</span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {role === 'customer' ? <CustomerView /> : <WaiterView />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}