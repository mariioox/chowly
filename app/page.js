'use client';

import { useState } from 'react';
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

      <section hidden={role !== 'customer'}>
        <CustomerView />
      </section>
      <section hidden={role !== 'waiter'}>
        <WaiterView />
      </section>
    </main>
  );
}