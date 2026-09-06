'use client';

import { motion } from 'framer-motion';

export default function MedallionSwitch({ role, onSwitch }) {
  const isWaiter = role === 'waiter';
  const flipProps = {
    animate: { rotateY: isWaiter ? 180 : 0 },
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  };

  return (
    <button
      type="button"
      className="role-coin"
      role="switch"
      aria-checked={isWaiter}
      aria-label={isWaiter ? 'Switch to customer view' : 'Switch to waiter view'}
      onClick={() => onSwitch(isWaiter ? 'customer' : 'waiter')}
    >
      <motion.span className="role-coin-inner" {...flipProps}>
        <span className="role-coin-face role-coin-front">
          <span className="coin-glyph">☕</span>
          <span className="coin-label">Guest</span>
        </span>
        <span className="role-coin-face role-coin-back">
          <span className="coin-glyph">◈</span>
          <span className="coin-label">Waiter</span>
        </span>
      </motion.span>
    </button>
  );
}