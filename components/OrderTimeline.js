'use client';

import { motion } from 'framer-motion';

const STEPS = ['placed', 'being_prepared', 'served', 'paid'];
const LABELS = {
  placed: 'Placed',
  being_prepared: 'Preparing',
  served: 'Served',
  paid: 'Paid',
};

export default function OrderTimeline({ status, compact = false }) {
  const reached = STEPS.indexOf(status);
  const idx = reached === -1 ? 0 : reached;
  const pct = (idx / (STEPS.length - 1)) * 100;

  return (
    <div
      className={`timeline ${compact ? 'timeline-compact' : ''}`}
      aria-label={`Order status: ${LABELS[status] ?? status}`}
    >
      <div className="timeline-track">
        <motion.div
          className="timeline-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
      <div className="timeline-stops">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const currentStep = i === idx;
          return (
            <span key={s} className="timeline-stop">
              <span
                className={`timeline-dot ${done ? 'done' : ''} ${currentStep ? 'current' : ''}`}
              />
              {!compact && <span className="timeline-label">{LABELS[s]}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}