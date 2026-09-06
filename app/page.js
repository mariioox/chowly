'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CustomerView from '@/components/CustomerView';
import WaiterView from '@/components/WaiterView';
import MedallionSwitch from '@/components/MedallionSwitch';

export default function Home() {
  const [role, setRole] = useState('customer');

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span className="logo">Chowly</span>
        </div>
        <MedallionSwitch role={role} onSwitch={setRole} />
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