'use client';

import { useState } from 'react';
import CustomerView from '@/components/CustomerView';
import WaiterView from '@/components/WaiterView';

export default function Home() {
  const [role, setRole] = useState('customer');

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="logo">🐔</span>
          Chowly
        </div>
        <div className="role-switch">
          <button
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            🍽️ Customer
          </button>
          <button
            className={`role-btn ${role === 'waiter' ? 'active' : ''}`}
            onClick={() => setRole('waiter')}
          >
            🧑‍🍳 Waiter
          </button>
        </div>
      </header>

      {role === 'customer' ? <CustomerView /> : <WaiterView />}
    </main>
  );
}
